// --- 모듈: 스킬 시스템 ---
const SkillSystem = {
    // 스킬 타입 정의
    SKILL_TYPES: {
        ATTACK: 'attack',
        ATTACK_SPECIAL: 'attack_special',
        ATTACK_CC: 'attack_cc',
        ATTACK_DEBUFF: 'attack_debuff',
        DEFENSE: 'defense',
        DEFENSE_BUFF: 'defense_buff',
        BUFF: 'buff',
        DEBUFF: 'debuff',
        CC: 'cc',
        CC_DEBUFF: 'cc_debuff',
        BUFF_CC: 'buff_cc'
    },

    // 스킬 효과 타입 정의
    EFFECT_TYPES: {
        DEFENSE_UP: 'defense_up',
        ATTACK_DOWN: 'attack_down',
        STUN: 'stun',
        COUNTER_ATTACK: 'counter_attack',
        FEAR: 'fear',
        SLOW: 'slow',
        SHIELD: 'shield',
        SPELL_POWER_UP: 'spell_power_up',
        POLYMORPH: 'polymorph',
        DOT: 'dot',
        EVASION_UP: 'evasion_up',
        BLIND: 'blind',
        STEALTH: 'stealth',
        VULNERABLE: 'vulnerable',
        VANISH_DODGE: 'vanish_dodge'
    },

    // 스킬 계산 메서드
    calculateDamage: function(skill, attacker, defender) {
        let damage = skill.power || 0;
        
        // 직업별 보너스 적용
        if (attacker.job === 'warrior') {
            damage *= 1.1; // 전사 공격력 10% 증가
        }
        
        // 방어력 계산
        const defense = defender.defense || 0;
        damage = Math.max(1, damage - defense);
        
        return Math.floor(damage);
    },

    // 스킬 효과 적용
    applyEffect: function(effect, target) {
        if (!effect) return;
        
        switch(effect.type) {
            case this.EFFECT_TYPES.DEFENSE_UP:
                target.defense = (target.defense || 0) + effect.value;
                break;
            case this.EFFECT_TYPES.ATTACK_DOWN:
                target.attack = (target.attack || 0) + effect.value;
                break;
            // 다른 효과들도 여기에 추가
        }
    },

    // 스킬 사용 가능 여부 확인
    canUseSkill: function(skill, player) {
        return (player.upkeep + skill.upkeep) <= GameConfig.MAX_UPKEEP;
    },

    // 스킬 설명 생성
    generateSkillDescription: function(skill) {
        let description = skill.description || '';
        
        if (skill.effect) {
            description += ` (효과: ${this.getEffectDescription(skill.effect)})`;
        }
        
        return description;
    },

    // 효과 설명 생성
    getEffectDescription: function(effect) {
        if (!effect) return '';
        
        switch(effect.type) {
            case this.EFFECT_TYPES.DEFENSE_UP:
                return `${effect.duration}턴간 방어력 +${effect.value}`;
            case this.EFFECT_TYPES.ATTACK_DOWN:
                return `${effect.duration}턴간 공격력 ${effect.value}`;
            // 다른 효과들도 여기에 추가
            default:
                return '';
        }
    }
};

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillSystem;
} 