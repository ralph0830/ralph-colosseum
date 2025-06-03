// --- 모듈: 게임 데이터 ---
const GameData = {
    jobs: {
        warrior: { 
            name: '전사', 
            description: '강인한 체력과 방어력의 근접 전문가.',
            baseHp: 120,
            passive: '기본 방어력 +5',
            icon: `https://placehold.co/80x80/FF6347/FFFFFF?text=W&font=Inter`, 
            bgColorClass: 'bg-red-700 hover:bg-red-600', 
            availableSkills: ['basicAttack', 'strongAttack', 'defend', 'warriorStrike', 'shieldBash', 'counterAttackStance', 'intimidatingShout', 'recklessCharge', 'lastStand'],
            isActive: true 
        },
        mage: { 
            name: '마법사', 
            description: '강력한 원소 마법과 디버프의 지배자. (업데이트 예정)',
            baseHp: 80,
            passive: '스킬 공격력 +10%',
            icon: `https://placehold.co/80x80/4682B4/FFFFFF?text=M&font=Inter`, 
            bgColorClass: 'bg-gray-500 hover:bg-gray-400', 
            availableSkills: ['basicAttack', 'fireball', 'weaken', 'iceLance', 'manaShield', 'chainLightning', 'arcaneIntellect', 'polymorph', 'meteor'],
            isActive: false 
        },
        rogue: { 
            name: '도적', 
            description: '민첩한 움직임과 치명적인 기습의 달인. (업데이트 예정)',
            baseHp: 100,
            passive: '회피율 +10%',
            icon: `https://placehold.co/80x80/3CB371/FFFFFF?text=R&font=Inter`, 
            bgColorClass: 'bg-gray-500 hover:bg-gray-400', 
            availableSkills: ['basicAttack', 'quickStrike', 'poisonStab', 'evasionUp', 'smokeBomb', 'shadowStep', 'cripplingBlow', 'exposeWeakness', 'vanish'],
            isActive: false 
        }
    },
    allSkills: {
        basicAttack: { name: '일반 공격', type: 'attack', upkeep: 5, power: 10, description: '기본적인 공격.' },
        strongAttack: { name: '강타', type: 'attack_special', upkeep: 15, power: 25, description: '강력한 일격.' },
        defend: { name: '방어 태세', type: 'defense', upkeep: 10, effect: { type: 'defense_up', value: 10, duration: 1 }, description: '1턴간 방어력 +10.' },
        warriorStrike: { name: '전사의 돌격', type: 'attack_special', upkeep: 20, power: 30, job: 'warrior', description: '큰 피해를 주는 돌격.' },
        shieldBash: { name: '방패 치기', type: 'attack_cc', upkeep: 15, power: 5, effect: { type: 'stun', duration: 1, chance: 0.5 }, job: 'warrior', description: '피해 + 50% 확률 1턴 기절.' },
        counterAttackStance: { name: '반격 태세', type: 'defense_buff', upkeep: 18, effect: { type: 'counter_attack', chance: 0.6, damageMultiplier: 0.7, duration: 1 }, job: 'warrior', description: '피격 시 60% 확률 반격 (피해의 70%). 상대 방어 시 자신 방어력 -5 페널티.' , penalty_on_opponent_defense: {type: 'self_defense_down', value: -5, duration:1}},
        intimidatingShout: { name: '위협의 외침', type: 'debuff', upkeep: 12, effect: { type: 'fear', attack_down_value: -7, duration: 1, chance: 0.6 }, target: 'enemy', job: 'warrior', description: '60% 확률 1턴 상대 공격력 -7.' },
        recklessCharge: { name: '무모한 돌진', type: 'attack_special', upkeep: 22, power: 40, selfEffect: {type: 'defense_down', value: -10, duration: 1}, job: 'warrior', description: '자신 방어력 -10, 큰 피해.'},
        lastStand: { name: '최후의 저항', type: 'buff', upkeep: 25, effect: {type: 'undying_rage', duration: 1, hp_threshold_percent: 0.2}, job: 'warrior', description: 'HP 20% 이하 시 1턴간 죽지 않음 (HP 1로 생존).'},
        fireball: { name: '화염구', type: 'attack_special', upkeep: 20, power: 35, job: 'mage', description: '큰 피해의 화염구.' },
        weaken: { name: '약화', type: 'debuff', upkeep: 15, effect: { type: 'attack_down', value: -5, duration: 2 }, target: 'enemy', job: 'mage', description: '2턴간 상대 공격력 -5.' },
        iceLance: { name: '얼음 창', type: 'attack_special', upkeep: 18, power: 28, effect: { type: 'slow', duration: 1, chance: 0.3 }, job: 'mage', description: '피해 + 30% 확률 1턴 상대 회피율 감소.' },
        manaShield: { name: '마나 보호막', type: 'defense_buff', upkeep: 20, effect: { type: 'shield', value: 30, duration: 2 }, job: 'mage', description: '2턴간 30 피해 흡수 보호막.' },
        chainLightning: { name: '연쇄 번개', type: 'attack_special', upkeep: 25, power: 18, hits: 2, job: 'mage', description: '2회 공격 번개 (총 36 피해).' },
        arcaneIntellect: { name: '신비한 지혜', type: 'buff', upkeep: 10, effect: { type: 'spell_power_up', value: 5, duration: 2 }, job: 'mage', description: '2턴간 스킬 공격력 +5.'},
        polymorph: { name: '변이', type: 'cc', upkeep: 22, effect: { type: 'polymorph', duration: 1, chance: 0.4 }, target: 'enemy', job: 'mage', description: '40% 확률 1턴 상대 행동 불가 양 변이.'},
        meteor: { name: '유성 낙하', type: 'attack_special', upkeep: 30, power: 50, job: 'mage', description: '매우 강력한 광역 피해 (단일 대상 적용).'},
        quickStrike: { name: '쾌속 공격', type: 'attack', upkeep: 10, power: 12, job: 'rogue', description: '빠른 2회 공격 (총 24 피해).', hits: 2},
        poisonStab: { name: '독 찌르기', type: 'attack_debuff', upkeep: 15, power: 8, effect: { type: 'dot', damage: 5, duration: 3 }, target: 'enemy', job: 'rogue', description: '피해 + 3턴간 매 턴 독 피해 5.' },
        evasionUp: { name: '회피 기동', type: 'buff', upkeep: 10, effect: { type: 'evasion_up', value: 0.2, duration: 2 }, job: 'rogue', description: '2턴간 회피율 +20%.' },
        smokeBomb: { name: '연막탄', type: 'cc_debuff', upkeep: 20, effect: { type: 'blind', duration: 1, chance: 0.7 }, job: 'rogue', description: '70% 확률 1턴 상대 명중률 감소.' },
        shadowStep: { name: '그림자 밟기', type: 'buff', upkeep: 15, effect: { type: 'stealth', next_attack_bonus: 15, duration: 1 }, job: 'rogue', description: '1턴 은신, 다음 공격 피해 +15.' },
        cripplingBlow: { name: '쇠약의 일격', type: 'attack_debuff', upkeep: 18, power: 15, effect: { type: 'defense_down', value: -8, duration: 2 }, target: 'enemy', job: 'rogue', description: '피해 + 2턴간 상대 방어력 -8.' },
        exposeWeakness: { name: '약점 노출', type: 'debuff', upkeep: 16, effect: {type: 'vulnerable', damage_increase_percent: 0.15, duration: 2}, target: 'enemy', job: 'rogue', description: '2턴간 상대 받는 모든 피해 +15%.'},
        vanish: { name: '소멸', type: 'buff_cc', upkeep: 25, effect: {type: 'vanish_dodge', duration: 1}, job:'rogue', description: '1턴간 모든 공격 회피, 다음 턴 반드시 선공 (구현 단순화: 1턴 회피).'}
    },
    aiCharacters: [ 
        { name: "AI 전사", jobKey: "warrior", skills: ["strongAttack", "defend", "shieldBash", "warriorStrike", "counterAttackStance", "basicAttack"] },
        { name: "AI 마법사", jobKey: "mage", skills: ["fireball", "manaShield", "weaken", "iceLance", "chainLightning", "basicAttack"] },
        { name: "AI 도적", jobKey: "rogue", skills: ["quickStrike", "poisonStab", "evasionUp", "smokeBomb", "shadowStep", "basicAttack"] },
        { name: "AI 밸런스형 전사", jobKey: "warrior", skills: ["basicAttack", "defend", "strongAttack", "basicAttack", "shieldBash", "intimidatingShout"] }
    ]
};
