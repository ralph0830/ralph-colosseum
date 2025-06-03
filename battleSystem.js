// --- 모듈: 전투 시스템 ---
const BattleSystem = {
    // 전투 상태
    BATTLE_STATES: {
        IDLE: 'idle',
        PLAYER_TURN: 'player_turn',
        OPPONENT_TURN: 'opponent_turn',
        GAME_OVER: 'game_over'
    },

    // 전투 초기화
    initializeBattle: function(player, opponent) {
        return {
            state: this.BATTLE_STATES.PLAYER_TURN,
            currentTurn: 1,
            player: this.initializeCombatant(player),
            opponent: this.initializeCombatant(opponent),
            log: []
        };
    },

    // 전투원 초기화
    initializeCombatant: function(character) {
        return {
            ...character,
            currentHp: character.maxHp,
            effects: [],
            isStunned: false,
            isDefending: false
        };
    },

    // 턴 진행
    processTurn: function(battle, skill, attacker, defender) {
        const log = [];
        
        // 스턴 상태 확인
        if (attacker.isStunned) {
            log.push(`${attacker.name}은(는) 기절 상태입니다.`);
            attacker.isStunned = false;
            return { battle, log };
        }

        // 스킬 사용
        const damage = SkillSystem.calculateDamage(skill, attacker, defender);
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        log.push(`${attacker.name}의 ${skill.name}이(가) ${defender.name}에게 ${damage}의 피해를 입혔습니다.`);

        // 효과 적용
        if (skill.effect) {
            SkillSystem.applyEffect(skill.effect, defender);
            log.push(SkillSystem.getEffectDescription(skill.effect));
        }

        // 전투 상태 업데이트
        battle.currentTurn++;
        if (battle.currentTurn > GameConfig.TOTAL_BATTLE_TURNS) {
            battle.state = this.BATTLE_STATES.GAME_OVER;
        }

        return { battle, log };
    },

    // 전투 종료 확인
    checkBattleEnd: function(battle) {
        if (battle.player.currentHp <= 0) {
            return { isOver: true, winner: battle.opponent };
        }
        if (battle.opponent.currentHp <= 0) {
            return { isOver: true, winner: battle.player };
        }
        if (battle.currentTurn > GameConfig.TOTAL_BATTLE_TURNS) {
            return { 
                isOver: true, 
                winner: battle.player.currentHp > battle.opponent.currentHp ? battle.player : battle.opponent 
            };
        }
        return { isOver: false };
    },

    // 전투 로그 추가
    addBattleLog: function(battle, message) {
        battle.log.push({
            turn: battle.currentTurn,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
};

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleSystem;
} 