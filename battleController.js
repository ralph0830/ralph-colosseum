// --- 모듈: 전투 컨트롤러 ---
const BattleController = {
    currentBattleTurn: 1, 
    isAutoProceedEnabled: false,
    autoProceedTimeoutId: null,
    lastPlayerSkillUsed: null,
    lastOpponentSkillUsed: null,
    isProcessingRound: false,

    async initializeBattle() {
        try {
            console.log('[BattleController.initializeBattle] 진입');
            if (!GameController.player || !GameController.player.selectedSkills.some(s => s !== null)) {
                console.error('플레이어 또는 스킬이 없습니다.');
                return;
            }

            // 전투 화면 표시
            UIManager.showScreen(UIManager.elements.battleScreen);
            
            // 전투 로그 초기화
            if (UIManager.elements.battleLog) {
                UIManager.elements.battleLog.innerHTML = '';
            }

            // 전투 로그 컨테이너 초기 상태 (숨김 처리 제거)
            // if (UIManager.elements.battleLogContainer) {
            //     UIManager.elements.battleLogContainer.classList.add('hidden');
            // }

            // 스킬 표시 업데이트
            UIManager.updateBattleSkills(GameController.player.selectedSkills);

            const availableAIProfiles = GameData.aiCharacters.filter(ai => GameData.jobs[ai.jobKey].isActive);
            let randomAIProfile;
            if (availableAIProfiles.length > 0) {
                randomAIProfile = availableAIProfiles[Math.floor(Math.random() * availableAIProfiles.length)];
            } else { 
                console.warn("선택 가능한 활성 AI 프로필이 없어 기본 전사 AI를 사용합니다.");
                randomAIProfile = GameData.aiCharacters.find(ai => ai.jobKey === 'warrior') || GameData.aiCharacters[0];
                 if (!randomAIProfile) {
                    console.error("AI 프로필을 찾을 수 없습니다! 게임을 시작할 수 없습니다.");
                    UIManager.logToBattleLog("오류: AI 상대를 찾을 수 없습니다.", "system");
                    GameController.resetGame(); // 또는 다른 오류 처리
                    return;
                }
            }

            GameController.opponent = new Player(1, randomAIProfile.name, randomAIProfile.jobKey, true);
            GameController.opponent.selectAISkills(); 

            UIManager.updateBattlePlayerUI(GameController.player);
            UIManager.updateBattlePlayerUI(GameController.opponent);
            UIManager.updateBattleSkills(); // 상대방 스킬도 업데이트
            
            this.currentBattleTurn = 1;
            UIManager.logToBattleLog("전투 시작! AI: " + GameController.opponent.name + " (" + GameController.opponent.jobData.name + ")", "system");
            this.updateBattleScreenRoundUI();
            // 다음 턴 버튼은 수동 진행 모드에서만 필요 (강제 자동 모드에서는 제거)
            if (UIManager.elements.nextRoundButton) {
                 UIManager.elements.nextRoundButton.style.display = 'none'; // 버튼 숨김
            }
            
            // 강제 자동 진행 시작
            this.isAutoProceedEnabled = true;
            if (UIManager.elements.autoProceedToggle) {
                UIManager.elements.autoProceedStatus.textContent = this.isAutoProceedEnabled ? "ON" : "OFF";
            }
            this.startAutoProceed();
        } catch (error) {
            console.error('전투 초기화 중 오류:', error);
        }
    },

    updateBattleScreenRoundUI() {
        UIManager.elements.roundInfoDisplay.textContent = `턴: ${this.currentBattleTurn} / ${GameConfig.TOTAL_BATTLE_TURNS}`;
        
        const playerSkillIndex = (this.currentBattleTurn - 1) % GameConfig.MAX_SKILL_SLOTS;
        const opponentSkillIndex = (this.currentBattleTurn - 1) % GameConfig.MAX_SKILL_SLOTS;

        const playerSkillData = GameController.player.selectedSkills[playerSkillIndex];
        const opponentSkillData = GameController.opponent.selectedSkills[opponentSkillIndex];

        // 현재 턴의 스킬 하이라이트
        UIManager.highlightCurrentSkills(playerSkillIndex, opponentSkillIndex);

        UIManager.displayCurrentRoundSkill(GameController.player, 
            playerSkillData ? GameData.allSkills[playerSkillData.skillKey].name : "스킬 없음",
            playerSkillData ? GameData.allSkills[playerSkillData.skillKey].description : ""
        );
        UIManager.displayCurrentRoundSkill(GameController.opponent, 
            opponentSkillData ? GameData.allSkills[opponentSkillData.skillKey].name : "스킬 없음",
            opponentSkillData ? GameData.allSkills[opponentSkillData.skillKey].description : ""
        );
    },
    
    toggleAutoProceed() {
        this.isAutoProceedEnabled = UIManager.elements.autoProceedToggle.checked;
        UIManager.elements.autoProceedStatus.textContent = this.isAutoProceedEnabled ? "ON" : "OFF";
        // 스위치 상태 변경 시 현재 타이머를 멈추고 새 타이머 시작
        this.stopAutoProceed(); 
        this.startAutoProceed();
    },

    startAutoProceed() {
        if (this.autoProceedTimeoutId) {
            this.stopAutoProceed(); // 기존 타이머가 있다면 제거
        }
        
        const delay = this.isAutoProceedEnabled ? GameConfig.FAST_AUTO_PROCEED_DELAY : GameConfig.AUTO_PROCEED_DELAY;
        
        if (!this.checkBattleOver() && UIManager.elements.battleScreen.classList.contains('flex')) {
            this.autoProceedTimeoutId = setTimeout(() => {
                if (!this.isProcessingRound) { // 라운드 처리 중이 아닐 때만 실행
                    this.processRoundActions();
                }
            }, delay);
        }
    },
    stopAutoProceed() {
        if (this.autoProceedTimeoutId) {
            clearTimeout(this.autoProceedTimeoutId);
            this.autoProceedTimeoutId = null;
        }
    },

    processRoundActions() {
        if (this.isProcessingRound) {
            console.log('[processRoundActions] 이미 라운드 처리 중입니다.');
            return;
        }

        console.log('[processRoundActions] 진입');
        this.isProcessingRound = true; // 라운드 처리 시작
        this.stopAutoProceed();

        try {
            GameController.player.processTurnStartEffects();
            GameController.opponent.processTurnStartEffects();
            
            if (this.checkBattleOver()) {
                console.log('Battle is over after processTurnStartEffects.');
                return;
            }

            const playerSkillSlotIndex = (this.currentBattleTurn - 1) % GameConfig.MAX_SKILL_SLOTS;
            const opponentSkillSlotIndex = (this.currentBattleTurn - 1) % GameConfig.MAX_SKILL_SLOTS;

            const playerSkillData = GameController.player.selectedSkills[playerSkillSlotIndex];
            const opponentSkillData = GameController.opponent.selectedSkills[opponentSkillSlotIndex];

            this.lastPlayerSkillUsed = playerSkillData ? GameData.allSkills[playerSkillData.skillKey] : null;
            this.lastOpponentSkillUsed = opponentSkillData ? GameData.allSkills[opponentSkillData.skillKey] : null;

            UIManager.logToBattleLog(`--- 턴 ${this.currentBattleTurn} 시작 ---`, "system");

            if (!playerSkillData) UIManager.logToBattleLog(`${GameController.player.name}이(가) 스킬을 사용하지 않았습니다.`, 'system');
            else UIManager.logToBattleLog(`${GameController.player.name}이(가) "${this.lastPlayerSkillUsed.name}" 스킬 사용!`, 'info');
            
            if (!opponentSkillData) UIManager.logToBattleLog(`${GameController.opponent.name}이(가) 스킬을 사용하지 않았습니다.`, 'system');
            else UIManager.logToBattleLog(`${GameController.opponent.name}이(가) "${this.lastOpponentSkillUsed.name}" 스킬 사용!`, 'info');

            if (playerSkillData && !GameController.player.isUnableToAct()) {
                this.executeSingleSkill(GameController.player, GameController.opponent, this.lastPlayerSkillUsed, playerSkillData.skillKey, this.lastOpponentSkillUsed); 
            } else if (GameController.player.isUnableToAct()) {
                UIManager.logToBattleLog(`${GameController.player.name}은(는) 행동 불가 상태입니다.`, 'status');
            }

            if (opponentSkillData && !GameController.opponent.isUnableToAct()) {
                 this.executeSingleSkill(GameController.opponent, GameController.player, this.lastOpponentSkillUsed, opponentSkillData.skillKey, this.lastPlayerSkillUsed); 
            } else if (GameController.opponent.isUnableToAct()) {
                 UIManager.logToBattleLog(`${GameController.opponent.name}은(는) 행동 불가 상태입니다.`, 'status');
            }
            
            if (this.checkBattleOver()) {
                 console.log('Battle is over after skills execution.');
                 return;
            }

            this.currentBattleTurn++;
            if (this.currentBattleTurn > GameConfig.TOTAL_BATTLE_TURNS) {
                console.log('Max turns reached.');
                this.endBattle(null);
                return;
            }
            
            this.updateBattleScreenRoundUI();

            if (!this.checkBattleOver()) {
                this.startAutoProceed();
            } else {
                console.log('Battle is over, stopping auto proceed.');
                this.stopAutoProceed();
            }
        } finally {
            this.isProcessingRound = false; // 라운드 처리 완료
        }
    },

    executeSingleSkill(attacker, defender, attackerSkill, attackerSkillKey, defenderSkill) {
        if (!attackerSkill) return;

        if (attackerSkill.type.includes('attack')) {
            UIManager.triggerScreenEffect(attacker.isAI ? 'flash-blue' : 'flash-red'); 
        }

        if (attackerSkill.name === '반격 태세' && attackerSkill.penalty_on_opponent_defense && defenderSkill && (defenderSkill.type.includes('defense') || defenderSkill.type.includes('buff'))) {
            UIManager.logToBattleLog(`${attacker.name}의 반격 태세! 하지만 ${defender.name}이(가) 방어/버프하여 ${attacker.name}에게 페널티!`, 'system');
            attacker.applyEffect(attackerSkill.penalty_on_opponent_defense, defender.name, attackerSkillKey);
            UIManager.triggerScreenEffect(attacker.isAI ? 'shake' : 'shake'); 
            return; 
        }

        if (attackerSkill.type.includes('attack') || attackerSkill.type.includes('attack_cc') || attackerSkill.type.includes('attack_debuff')) {
            if (defender.canEvade(attackerSkill.type)) { 
                UIManager.logToBattleLog(`${defender.name}이(가) ${attacker.name}의 "${attackerSkill.name}" 공격을 회피했습니다!`, 'system');
                return; 
            }
            if (attacker.isBlinded() && Math.random() < 0.5) { 
                UIManager.logToBattleLog(`${attacker.name}은(는) 실명 상태라 "${attackerSkill.name}" 공격이 빗나갔습니다!`, 'status');
                return;
            }
        }
        
        let damage = 0;
        let basePower = attackerSkill.power || 0;

        const stealthBuff = attacker.buffs.find(b => b.type === 'stealth');
        if (stealthBuff && (attackerSkill.type.includes('attack') || attackerSkill.type.includes('attack_special') || attackerSkill.type.includes('attack_debuff') || attackerSkill.type.includes('attack_cc'))) {
            UIManager.logToBattleLog(`${attacker.name}의 은신 공격! 피해량 +${stealthBuff.next_attack_bonus}`, 'effect');
            basePower += stealthBuff.next_attack_bonus;
            attacker.buffs = attacker.buffs.filter(b => b !== stealthBuff); 
        }
        
        let currentSpellPower = attacker.spellPowerModifier;
        if (attacker.jobKey === 'mage' && attackerSkill.type.includes('special')) currentSpellPower += Math.round(basePower * 0.1); 

        if (attackerSkill.type.includes('attack') || attackerSkill.type.includes('attack_special') || attackerSkill.type.includes('attack_debuff') || attackerSkill.type.includes('attack_cc')) {
            damage = basePower + attacker.attackModifier + currentSpellPower;
            if (attackerSkill.hits) damage *= attackerSkill.hits; 
            
            let shieldBuff = defender.buffs.find(b => b.type === 'shield' && b.currentShieldHp > 0);
            if (shieldBuff) {
                const damageToShield = Math.min(damage, shieldBuff.currentShieldHp);
                shieldBuff.currentShieldHp -= damageToShield;
                damage -= damageToShield;
                UIManager.logToBattleLog(`${defender.name}의 보호막이 ${damageToShield}의 피해를 흡수! (남은 보호막: ${shieldBuff.currentShieldHp})`, 'effect');
                if (shieldBuff.currentShieldHp <= 0) {
                    defender.buffs = defender.buffs.filter(b => b !== shieldBuff);
                    UIManager.logToBattleLog(`${defender.name}의 보호막이 파괴되었습니다!`, 'effect');
                }
            }
            if (damage > 0) {
                defender.takeDamage(damage, attackerSkill, attacker.name);
                UIManager.triggerScreenEffect('shake'); 
            }
        }

        if (attackerSkill.effect) {
            const target = attackerSkill.target === 'enemy' ? defender : attacker;
            target.applyEffect({...attackerSkill.effect}, attacker.name, attackerSkillKey);
        }
        if (attackerSkill.selfEffect) {
            attacker.applyEffect({...attackerSkill.selfEffect}, attacker.name, attackerSkillKey);
        }
    },
    
    checkBattleOver() {
        if (GameController.player && GameController.player.hp <= 0) {
            this.endBattle(GameController.opponent); 
            return true;
        }
        if (GameController.opponent && GameController.opponent.hp <= 0) {
            this.endBattle(GameController.player); 
            return true;
        }
        return false;
    },

    endBattle(winner) { 
        this.stopAutoProceed(); 
        UIManager.showGameOverModal(winner, this.lastPlayerSkillUsed, this.lastOpponentSkillUsed);
        
        // 플레이어가 승리한 경우에만 꽃가루 이펙트 실행
        if (winner === GameController.player) {
            createConfetti();
        }
    },

    async executePlayerTurn() {
        try {
            // ... existing code ...
            
            // 현재 사용 중인 스킬 하이라이트
            UIManager.highlightCurrentSkill(this.currentPlayerSkillIndex);
            
            // ... existing code ...
        } catch (error) {
            console.error('플레이어 턴 실행 중 오류:', error);
        }
    }
};
