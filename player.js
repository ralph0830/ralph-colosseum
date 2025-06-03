// --- 모듈: 플레이어 클래스 ---
class Player { 
    constructor(id, name, jobKey, isAI = false) {
        this.id = id; 
        this.name = name;
        this.jobData = GameData.jobs[jobKey]; 
        this.jobKey = jobKey;
        this.maxHp = this.jobData.baseHp;
        this.hp = this.maxHp;
        this.selectedSkills = Array(GameConfig.MAX_SKILL_SLOTS).fill(null); 
        this.currentUpkeep = 0;
        this.buffs = []; 
        this.debuffs = []; 
        this.statusEffects = [];
        this.defense = 0; 
        this.attackModifier = 0; 
        this.spellPowerModifier = 0; 
        this.evasionChance = 0.05; 
        this.vulnerableModifier = 0; 
        this.isAI = isAI;
        this.activeSkillSetId = null; // 현재 활성화된 스킬 세팅의 ID (Firestore 문서 ID 또는 로컬 식별자)

        // 직업 패시브 적용
        if (jobKey === 'warrior' && GameData.jobs.warrior.isActive) this.defense += 5; 
        if (jobKey === 'rogue' && GameData.jobs.rogue.isActive) this.evasionChance += 0.1;
        // 마법사 패시브는 스킬 실행 시점에 공격력 계산에 포함 (GameData.jobs.mage.isActive 확인 필요)
    }

    // 스킬을 스킬 슬롯에 추가하는 메소드
    addSkill(skillKey, slotIndex) {
        if (slotIndex >= GameConfig.MAX_SKILL_SLOTS) return false; 
        if (this.selectedSkills[slotIndex]) { // 이미 해당 슬롯에 스킬이 있다면 제거
            this.removeSkill(slotIndex);
        }
        const skill = GameData.allSkills[skillKey];
        if (this.currentUpkeep + skill.upkeep > GameConfig.MAX_UPKEEP) {
            UIManager.logToBattleLog(`Upkeep 한도 초과! (${skill.name} 선택 불가)`, 'system');
            return false;
        }
        this.selectedSkills[slotIndex] = { skillKey: skillKey, originalUpkeep: skill.upkeep };
        this.currentUpkeep += skill.upkeep;
        this.updateUpkeepDisplay(); // UI 업데이트
        return true;
    }

    // 스킬 슬롯에서 스킬을 제거하는 메소드
    removeSkill(slotIndex) {
        if (slotIndex >= GameConfig.MAX_SKILL_SLOTS) return;
        const skillData = this.selectedSkills[slotIndex];
        if (skillData) {
            this.currentUpkeep -= skillData.originalUpkeep;
            this.selectedSkills[slotIndex] = null;
            this.updateUpkeepDisplay(); // UI 업데이트
        }
    }
    
    // 현재 Upkeep 상태를 UI에 업데이트하는 메소드 (플레이어 전용)
    updateUpkeepDisplay() { 
        if (!this.isAI) { // AI는 이 메소드를 직접 호출하지 않음
            UIManager.elements.playerUpkeepDisplay.textContent = this.currentUpkeep;
            this.checkReadyState();
        }
    }

    // 플레이어가 전투를 시작할 준비가 되었는지 확인하는 메소드 (플레이어 전용)
    checkReadyState() { 
        if (!this.isAI) {
            // Upkeep 한도만 체크 (빈 칸 허용)
            if (this.currentUpkeep <= GameConfig.MAX_UPKEEP) {
                UIManager.elements.confirmSkillSetupButton.disabled = false; 
                UIManager.elements.confirmSkillSetupButton.classList.remove('disabled-button');
            } else {
                UIManager.elements.confirmSkillSetupButton.disabled = true;
                UIManager.elements.confirmSkillSetupButton.classList.add('disabled-button');
            }
        }
    }
    
    // AI가 사용할 스킬을 자동으로 선택하는 메소드
    selectAISkills() {
        if (!this.isAI) return;
        // AI는 현재 활성화된 직업(전사) 중에서만 선택하도록 하거나, 해당 직업 프로필만 사용
        const availableAIProfiles = GameData.aiCharacters.filter(ai => GameData.jobs[ai.jobKey].isActive);
        let aiProfile;
        if (availableAIProfiles.length > 0) {
            aiProfile = availableAIProfiles[Math.floor(Math.random() * availableAIProfiles.length)];
        } else { 
            console.warn("선택 가능한 활성 AI 프로필이 없어 기본 전사 AI를 사용합니다.");
            aiProfile = GameData.aiCharacters.find(ai => ai.jobKey === 'warrior') || GameData.aiCharacters[0]; // 기본값으로 첫번째 AI라도 사용
             if (!aiProfile) { // 이 경우도 대비
                console.error("AI 프로필을 찾을 수 없습니다!");
                this.selectedSkills = Array(GameConfig.MAX_SKILL_SLOTS).fill({ skillKey: 'basicAttack', originalUpkeep: GameData.allSkills.basicAttack.upkeep });
                this.currentUpkeep = this.selectedSkills.reduce((sum, s) => sum + (s ? s.originalUpkeep : 0), 0);
                return;
            }
        }
        
        this.name = aiProfile.name; 
        this.jobKey = aiProfile.jobKey;
        this.jobData = GameData.jobs[this.jobKey];
        this.maxHp = this.jobData.baseHp;
        this.hp = this.maxHp;
        this.defense = (this.jobKey === 'warrior' && this.jobData.passive === '기본 방어력 +5') ? 5 : 0; 
        this.evasionChance = (this.jobKey === 'rogue' && this.jobData.passive === '회피율 +10%') ? 0.15 : 0.05; // 도적은 현재 비활성
        this.currentUpkeep = 0; // Upkeep 초기화 후 재계산

        let skillsToSelect = aiProfile.skills.slice(0, GameConfig.MAX_SKILL_SLOTS);
        
        for (let i = 0; i < GameConfig.MAX_SKILL_SLOTS; i++) {
            if (skillsToSelect[i]) {
                const skillKey = skillsToSelect[i];
                const skill = GameData.allSkills[skillKey];
                if (skill && this.currentUpkeep + skill.upkeep <= GameConfig.MAX_UPKEEP) { // skill 존재 여부 확인
                    this.selectedSkills[i] = { skillKey: skillKey, originalUpkeep: skill.upkeep };
                    this.currentUpkeep += skill.upkeep;
                } else {
                    this.selectedSkills[i] = null; 
                }
            } else {
                // 남는 슬롯은 기본 공격으로 채우기 (Upkeep 고려)
                if (this.currentUpkeep + GameData.allSkills.basicAttack.upkeep <= GameConfig.MAX_UPKEEP) {
                    this.selectedSkills[i] = { skillKey: 'basicAttack', originalUpkeep: GameData.allSkills.basicAttack.upkeep };
                    this.currentUpkeep += GameData.allSkills.basicAttack.upkeep;
                } else {
                    this.selectedSkills[i] = null;
                }
            }
        }
    }

    // 피해를 받는 메소드
    takeDamage(amount, sourceSkill = null, attackerName = "상대") {
        let finalAmount = amount * (1 + this.vulnerableModifier); 
        let actualDamage = Math.max(0, finalAmount - this.defense); 
        
        const undyingBuff = this.buffs.find(b => b.type === 'undying_rage');
        if (undyingBuff && this.hp <= this.maxHp * undyingBuff.hp_threshold_percent && (this.hp - actualDamage) <= 0) {
            actualDamage = this.hp - 1; 
            UIManager.logToBattleLog(`${this.name}이(가) 최후의 저항으로 버팁니다!`, 'status');
            this.buffs = this.buffs.filter(b => b !== undyingBuff); 
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        UIManager.logToBattleLog(`${this.name}이(가) ${attackerName}의 ${sourceSkill ? `"${sourceSkill.name}" 스킬로 ` : ""} ${Math.round(actualDamage)} 피해! (방어 ${this.defense}, 취약 ${Math.round(this.vulnerableModifier*100)}%)`, 'damage');
        UIManager.updateBattlePlayerUI(this); 

        const counterBuff = this.buffs.find(b => b.type === 'counter_attack' && b.duration > 0);
        const opponentPlayer = this.isAI ? GameController.player : GameController.opponent; 
        if (counterBuff && sourceSkill && (sourceSkill.type.includes('attack') || sourceSkill.type.includes('attack_cc')) && Math.random() < counterBuff.chance) {
            const counterDamage = Math.round(actualDamage * counterBuff.damageMultiplier);
            if (counterDamage > 0 && opponentPlayer) { // opponentPlayer 존재 확인
                UIManager.logToBattleLog(`${this.name}이(가) 반격하여 ${opponentPlayer.name}에게 ${counterDamage}의 피해!`, 'effect');
                opponentPlayer.takeDamage(counterDamage, {name: "반격"}, this.name); 
                UIManager.triggerScreenEffect(opponentPlayer.isAI ? 'flash-red' : 'flash-blue'); 
            }
        }
        return actualDamage;
    }

    // HP를 회복하는 메소드
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        UIManager.logToBattleLog(`${this.name}이(가) ${amount}만큼 회복했습니다.`, 'heal');
        UIManager.updateBattlePlayerUI(this); 
    }

    // 버프/디버프/상태이상을 적용하는 메소드
    applyEffect(effect, sourcePlayerName, skillKeyApplied) {
        UIManager.logToBattleLog(`${this.name}에게 ${GameData.allSkills[skillKeyApplied]?.name} 효과 (${effect.type}) 적용! (출처: ${sourcePlayerName})`, 'effect');
        const newEffect = { ...effect, source: sourcePlayerName, skillKey: skillKeyApplied };

        switch(effect.type) {
            case 'defense_up': this.buffs.push(newEffect); this.defense += effect.value; break;
            case 'self_defense_down': 
            case 'defense_down': this.debuffs.push(newEffect); this.defense += effect.value; break;
            case 'attack_down': this.debuffs.push(newEffect); this.attackModifier += (effect.value || effect.attack_down_value); break;
            case 'dot': this.debuffs.push(newEffect); break;
            case 'stun': case 'blind': case 'polymorph': 
                if (Math.random() < (effect.chance || 1)) this.statusEffects.push(newEffect);
                else UIManager.logToBattleLog(`${this.name}이(가) ${effect.type} 효과에 저항했습니다!`, 'system');
                break;
            case 'slow': 
                 if (Math.random() < (effect.chance || 1)) {
                   this.debuffs.push(newEffect);
                   this.evasionChance = Math.max(0, this.evasionChance - 0.15); 
                   UIManager.logToBattleLog(`${this.name}의 회피율이 감소했습니다.`, 'status');
                } else UIManager.logToBattleLog(`${this.name}이(가) ${effect.type} 효과에 저항했습니다!`, 'system');
                break;
            case 'shield': this.buffs.push({ ...newEffect, currentShieldHp: effect.value }); break;
            case 'evasion_up': this.buffs.push(newEffect); this.evasionChance += effect.value; break;
            case 'counter_attack': this.buffs.push(newEffect); break;
            case 'fear': 
                if (Math.random() < (effect.chance || 1)) this.statusEffects.push(newEffect); 
                else UIManager.logToBattleLog(`${this.name}이(가) ${effect.type} 효과에 저항했습니다!`, 'system');
                break;
            case 'spell_power_up': this.buffs.push(newEffect); this.spellPowerModifier += effect.value; break;
            case 'stealth': this.buffs.push(newEffect); break;
            case 'vulnerable': this.debuffs.push(newEffect); this.vulnerableModifier += effect.damage_increase_percent; break;
            case 'undying_rage': this.buffs.push(newEffect); break;
            case 'vanish_dodge': this.buffs.push(newEffect); UIManager.logToBattleLog(`${this.name}이(가) 소멸하여 1턴간 모든 공격을 회피합니다!`, 'status'); break;
        }
        UIManager.updateBattlePlayerUI(this); 
    }
    
    // 턴 시작 시 효과를 처리하는 메소드 (지속 데미지, 버프/디버프 지속시간 감소 등)
    processTurnStartEffects() { 
        this.statusEffects = this.statusEffects.filter(effect => {
            if (effect.type === 'stun' || effect.type === 'polymorph') UIManager.logToBattleLog(`${this.name}은(는) ${effect.type === 'stun' ? '기절' : '변이'} 상태입니다! 행동 불가.`, 'status');
            if (effect.type === 'fear' && effect.duration === 1) UIManager.logToBattleLog(`${this.name}의 두려움 효과가 사라집니다.`, 'status');
            effect.duration--;
            return effect.duration > 0;
        });
        this.debuffs = this.debuffs.filter(debuff => {
            if (debuff.type === 'dot') {
                UIManager.logToBattleLog(`${this.name}이(가) ${debuff.source}의 ${GameData.allSkills[debuff.skillKey]?.name} 효과로 ${debuff.damage}의 지속 피해!`, 'status');
                this.takeDamage(debuff.damage, {name: "지속 피해"}, debuff.source); 
            }
            if (debuff.duration === 1) { 
                if (debuff.type === 'attack_down') this.attackModifier -= (debuff.value || debuff.attack_down_value);
                if (debuff.type === 'defense_down' || debuff.type === 'self_defense_down') this.defense -= debuff.value;
                if (debuff.type === 'slow') this.evasionChance += 0.15; 
                if (debuff.type === 'vulnerable') this.vulnerableModifier -= debuff.damage_increase_percent;
            }
            debuff.duration--;
            return debuff.duration > 0;
        });
        this.buffs = this.buffs.filter(buff => {
            if (buff.duration === 1) { 
                if (buff.type === 'defense_up') this.defense -= buff.value;
                if (buff.type === 'evasion_up') this.evasionChance -= buff.value;
                if (buff.type === 'spell_power_up') this.spellPowerModifier -= buff.value;
                if (buff.type === 'stealth') UIManager.logToBattleLog(`${this.name}의 은신 효과가 사라집니다.`, 'status');
                if (buff.type === 'counter_attack') UIManager.logToBattleLog(`${this.name}의 반격 태세가 사라집니다.`, 'status');
                if (buff.type === 'undying_rage') UIManager.logToBattleLog(`${this.name}의 최후의 저항 효과가 사라집니다.`, 'status');
                if (buff.type === 'vanish_dodge') UIManager.logToBattleLog(`${this.name}의 소멸 효과가 사라집니다.`, 'status');
            }
            buff.duration--;
            return buff.duration > 0;
        });
        UIManager.updateBattlePlayerUI(this); 
    }
    isUnableToAct() { return this.statusEffects.some(effect => effect.type === 'stun' || effect.type === 'polymorph'); }
    canEvade(skillType) { 
        if (this.buffs.some(b => b.type === 'vanish_dodge' && b.duration > 0) && skillType && skillType.includes('attack')) {
            UIManager.logToBattleLog(`${this.name}이(가) 소멸 효과로 공격을 회피합니다!`, 'status');
            return true;
        }
        return Math.random() < this.evasionChance;
    }
    isBlinded() { return this.statusEffects.some(effect => effect.type === 'blind'); }
}
