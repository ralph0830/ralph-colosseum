// --- 모듈: 게임 컨트롤러 (전체 흐름 관리) ---
const GameController = {
    player: null, 
    opponent: null, 
    selectedPlayerJobKey: null, 
    currentUser: null, 
    currentSkillSetSlotToSave: null, 
    playerSkillSets: Array(GameConfig.MAX_SKILL_SETS).fill(null), 
    activeSkillSetIndex: null, 

    initialize() {
        AuthManager.initialize(); 
        AuthManager.checkAuthState(); 
    },

    async updateUIBasedOnAuthState(user) {
        this.currentUser = user;
        if (user) { 
            UIManager.elements.authScreen.classList.add('hidden');
            UIManager.elements.logoutButton.classList.remove('hidden');
            const userDisplayName = user.displayName || user.email.split('@')[0];
            UIManager.elements.logoutButton.textContent = `${userDisplayName} 로그아웃`; 
            if(UIManager.elements.currentPlayerNameDisplay_manage) UIManager.elements.currentPlayerNameDisplay_manage.textContent = userDisplayName;

            await this.loadUserSkillSets(); 
            UIManager.showScreen(UIManager.elements.skillManagementScreen);

        } else { 
            UIManager.showScreen(UIManager.elements.authScreen);
            UIManager.elements.logoutButton.classList.add('hidden');
            UIManager.elements.authMessage.textContent = ""; 
            this.playerSkillSets = Array(GameConfig.MAX_SKILL_SETS).fill(null); 
            this.activeSkillSetIndex = null;
            this.player = null; 
            this.selectedPlayerJobKey = null;
        }
    },

    async loadUserSkillSets() {
        try {
            const user = FirebaseService.auth.currentUser;
            if (!user) {
                console.log("사용자가 로그인되어 있지 않습니다.");
                return;
            }

            const skillSets = await FirebaseService.loadAllSkillSettings(user.uid);
            console.log(`사용자 ${user.uid}의 스킬 세팅 로드 완료:`, skillSets);
            console.log('스킬 세트 구조:', skillSets.map(set => set ? {
                name: set.name,
                jobKey: set.jobKey,
                skills: set.skills,
                upkeep: set.upkeep
            } : null));

            if (!skillSets || skillSets.every(set => set === null)) {
                console.log("저장된 스킬 세팅이 없습니다. 새 세팅을 만들어주세요.");
                UIManager.elements.authMessage.textContent = "저장된 스킬 세팅이 없습니다. 직업을 선택하고 새 세팅을 만들어주세요.";
                UIManager.elements.authMessage.classList.remove('text-red-400');
                UIManager.elements.authMessage.classList.add('text-yellow-400');
            }

            // 스킬 세트를 playerSkillSets에 할당
            this.playerSkillSets = skillSets;
            console.log('[loadUserSkillSets] playerSkillSets 할당됨:', this.playerSkillSets);

            UIManager.updateSkillSetPreview(skillSets);
            return skillSets;
        } catch (error) {
            console.error("스킬 세팅 로드 중 오류 발생:", error);
            UIManager.elements.authMessage.textContent = "스킬 세팅 로드 중 오류가 발생했습니다.";
            UIManager.elements.authMessage.classList.add('text-red-400');
            return null;
        }
    },

    selectPlayerJob(jobKey, selectedCardElement) {
        if (!GameData.jobs[jobKey].isActive) return; 

        this.selectedPlayerJobKey = jobKey;
        Array.from(UIManager.elements.playerJobSelect.children).forEach(child => 
            child.classList.remove('selected', 'border-blue-500', 'ring-2', 'ring-offset-2', 'ring-indigo-400')
        );
        selectedCardElement.classList.add('selected', 'ring-2', 'ring-offset-2', 'ring-indigo-400');
        UIManager.elements.confirmJobButton.disabled = false; 
        UIManager.elements.confirmJobButton.classList.remove('disabled-button');
    },

    confirmPlayerJob() { 
        if (!this.selectedPlayerJobKey) {
            UIManager.logToBattleLog("직업을 선택해주세요.", "system"); 
            return;
        }
        const playerName = this.currentUser?.displayName || this.currentUser?.email?.split('@')[0] || "플레이어";
        this.player = new Player(0, playerName, this.selectedPlayerJobKey, false);
        this.player.selectedSkills = Array(GameConfig.MAX_SKILL_SLOTS).fill(null);
        this.player.currentUpkeep = 0;
        
        UIManager.showScreen(UIManager.elements.skillSelectionScreen); 
        UIManager.elements.playerJobName.textContent = this.player.jobData.name; 
        UIManager.populateAvailableSkillsForPlayer(); 
        UIManager.renderPlayerSelectedSkills(); 
    },

    confirmSkillSetup() { 
        if (!this.player || !this.player.selectedSkills.some(s => s !== null)) {
            UIManager.logToBattleLog("하나 이상의 스킬을 배치해야 합니다.", "system");
            return;
        }
        if (this.currentSkillSetSlotToSave === null) { // 새 세팅 저장 시 (빈 슬롯에서 시작)
            const emptySlotIndex = this.playerSkillSets.findIndex(set => set === null);
            if (emptySlotIndex !== -1) {
                this.currentSkillSetSlotToSave = emptySlotIndex;
            } else {
                UIManager.logToBattleLog("저장할 빈 슬롯이 없습니다. 기존 세팅을 삭제해주세요.", "system");
                UIManager.showScreen(UIManager.elements.skillManagementScreen);
                this.loadUserSkillSets();
                return;
            }
        }
        // currentSkillSetSlotToSave는 handleEmptySlotClick 또는 editSkillSet에서 이미 설정됨
        UIManager.showSkillSetNameModal(); 
    },

    editCurrentSkillSet() { 
        if (this.activeSkillSetIndex !== null && this.playerSkillSets[this.activeSkillSetIndex]) {
            this.editSkillSet(this.activeSkillSetIndex);
        } else {
            UIManager.logToBattleLog("활성화된 스킬 세팅이 없습니다. 먼저 세팅을 선택하거나 만들어주세요.", "system");
            this.handleEmptySlotClick(this.playerSkillSets.findIndex(s => s === null) ?? 0);
        }
    },
    
    async startMatch() {
        console.log('[startMatch] 진입');
        console.log('[startMatch] activeSkillSetIndex:', GameController.activeSkillSetIndex);
        console.log('[startMatch] playerSkillSets:', GameController.playerSkillSets);
        
        try {
            if (GameController.activeSkillSetIndex === null || !GameController.playerSkillSets[GameController.activeSkillSetIndex]) {
                UIManager.logToBattleLog("매칭을 시작하려면 먼저 사용할 스킬 세팅을 선택해주세요.", "system");
                return;
            }
            
            await GameController.activateSkillSet(GameController.activeSkillSetIndex, false);
            console.log('[startMatch] player:', GameController.player);
            console.log('[startMatch] selectedSkills:', GameController.player.selectedSkills);

            if (!GameController.player || !GameController.player.selectedSkills.some(s => s !== null)) {
                UIManager.logToBattleLog("활성화된 세팅에 스킬이 없습니다.", "system");
                return;
            }

            if (typeof BattleController === 'undefined' || !BattleController.initializeBattle) {
                console.error('BattleController가 초기화되지 않았습니다.');
                UIManager.logToBattleLog("게임 시스템 초기화 중 오류가 발생했습니다.", "system");
                return;
            }

            console.log('[startMatch] BattleController.initializeBattle() 호출');
            await BattleController.initializeBattle();
            
        } catch (e) {
            console.error('[startMatch] 에러:', e);
            UIManager.logToBattleLog("매칭 시작 중 오류가 발생했습니다: " + e.message, "system");
        }
    },


    addSkillToPlayerFirstEmptySlot(skillKey) {
        if (!GameController.player) { 
            UIManager.logToBattleLog("먼저 직업을 선택해주세요.", "system");
            UIManager.showScreen(UIManager.elements.jobSelectionScreen);
            return;
        }
        const emptySlotIndex = GameController.player.selectedSkills.findIndex(s => s === null);
        if (emptySlotIndex !== -1 && emptySlotIndex < GameConfig.MAX_SKILL_SLOTS) {
            if (GameController.player.addSkill(skillKey, emptySlotIndex)) {
                UIManager.renderPlayerSelectedSkills(); 
            }
        } else {
            UIManager.logToBattleLog(`모든 스킬 슬롯이 찼거나 슬롯 인덱스가 유효하지 않습니다. (클릭으로 제거)`, 'system');
        }
    },

    promptSaveSkillSet(slotIndex) { 
        if (!GameController.player || !GameController.player.selectedSkills.some(s => s !== null)) {
            UIManager.logToBattleLog("저장할 스킬 구성이 없습니다. 먼저 스킬을 배치해주세요.", "system");
            GameController.currentSkillSetSlotToSave = slotIndex; 
            UIManager.showScreen(UIManager.elements.skillSelectionScreen);
            if (GameController.player) { 
                 UIManager.elements.playerJobName.textContent = GameController.player.jobData.name;
                 UIManager.populateAvailableSkillsForPlayer();
                 UIManager.renderPlayerSelectedSkills();
            } else { 
                 UIManager.showScreen(UIManager.elements.jobSelectionScreen);
                 UIManager.populateJobSelectionForPlayer();
            }
            return;
        }
        GameController.currentSkillSetSlotToSave = slotIndex; 
        UIManager.showSkillSetNameModal();
    },
    
    async saveCurrentSkillsToNewSlot() { 
        if (!GameController.currentUser || !GameController.player || !GameController.player.selectedSkills.some(s => s !== null)) {
            UIManager.logToBattleLog("저장할 스킬 구성이 없거나 로그인되지 않았습니다.", "system");
            return;
        }
        
        const emptySlotIndex = GameController.playerSkillSets.findIndex(set => set === null);

        if (emptySlotIndex === -1) {
            UIManager.logToBattleLog("모든 스킬 세팅 슬롯이 사용 중입니다. 기존 세팅을 삭제 후 시도해주세요.", "system");
            return;
        }
        GameController.promptSaveSkillSet(emptySlotIndex);
    },


    async confirmSaveSkillSetName() {
        const setName = UIManager.elements.skillSetNameInput.value.trim();
        if (!setName) {
            UIManager.logToBattleLog("세팅 이름을 입력해주세요.", "system");
            return;
        }
        if (GameController.currentUser && GameController.player && GameController.currentSkillSetSlotToSave !== null) {
            const skillSetData = {
                name: setName,
                jobKey: GameController.player.jobKey,
                skills: GameController.player.selectedSkills.map(s => s ? s.skillKey : null), 
                upkeep: GameController.player.currentUpkeep,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await FirebaseService.saveSkillSetting(GameController.currentUser.uid, GameController.currentSkillSetSlotToSave, skillSetData);
            UIManager.hideSkillSetNameModal();
            UIManager.logToBattleLog(`"${setName}" 스킬 세팅이 슬롯 ${GameController.currentSkillSetSlotToSave + 1}에 저장되었습니다.`, "system");
            
            await GameController.loadUserSkillSets(); 
            GameController.activateSkillSet(GameController.currentSkillSetSlotToSave, false); 
            UIManager.showScreen(UIManager.elements.skillManagementScreen); 
        }
        GameController.currentSkillSetSlotToSave = null;
    },
    
    activateSkillSet(slotIndex, showLog = true) {
        try {
            if (!GameController.currentUser) return;
            const setToActivate = GameController.playerSkillSets[slotIndex]; 

            if (setToActivate && GameData.jobs[setToActivate.jobKey]?.isActive) {
                const playerName = GameController.currentUser?.displayName || GameController.currentUser?.email?.split('@')[0] || "플레이어";
                GameController.player = new Player(0, playerName, setToActivate.jobKey, false);
                
                GameController.player.selectedSkills = Array(GameConfig.MAX_SKILL_SLOTS).fill(null);
                let currentUpkeep = 0;
                if (setToActivate.skills && Array.isArray(setToActivate.skills)) {
                    setToActivate.skills.forEach((skillKey, index) => {
                        if (index < GameConfig.MAX_SKILL_SLOTS && skillKey && GameData.allSkills[skillKey]) {
                            const skill = GameData.allSkills[skillKey];
                            GameController.player.selectedSkills[index] = { skillKey: skillKey, originalUpkeep: skill.upkeep };
                            currentUpkeep += skill.upkeep;
                        } else {
                            GameController.player.selectedSkills[index] = null;
                        }
                    });
                }
                GameController.player.currentUpkeep = currentUpkeep;
                GameController.selectedPlayerJobKey = setToActivate.jobKey; 
                GameController.player.activeSkillSetId = setToActivate.id; 
                GameController.activeSkillSetIndex = slotIndex;

                // 디버깅 로그
                console.log('[activateSkillSet] player:', GameController.player);
                console.log('[activateSkillSet] selectedSkills:', GameController.player.selectedSkills);

                if (showLog) UIManager.logToBattleLog(`"${setToActivate.name}" 세팅이 활성화되었습니다.`, "system");
                // UIManager.renderSkillSetSlots(GameController.playerSkillSets, slotIndex); // 화면 갱신은 loadUserSkillSets에서 처리

                console.log('[activateSkillSet] selectedSkills:', JSON.stringify(GameController.player.selectedSkills));
            } else {
                if (showLog) UIManager.logToBattleLog("선택한 스킬 세팅을 불러올 수 없거나, 해당 직업이 비활성화 상태입니다.", "system");
            }
        } catch (e) {
            console.error(e);
        }
    },
    
    async activateAndStartMatch(slotIndex) {
        await GameController.activateSkillSet(slotIndex, true); 
        if (GameController.player && GameController.player.selectedSkills.some(s => s !== null)) {
            GameController.startMatch(); 
        } else {
            UIManager.logToBattleLog("활성화된 세팅에 스킬이 없어 매칭을 시작할 수 없습니다.", "system");
        }
    },

    async editSkillSet(slotIndex) {
        GameController.currentSkillSetSlotToSave = slotIndex; // 편집 후 저장될 슬롯 기억
        await GameController.activateSkillSet(slotIndex, false); // 해당 세팅으로 플레이어 정보 로드

        if (GameController.player) {
            UIManager.showScreen(UIManager.elements.skillSelectionScreen);
            UIManager.elements.playerJobName.textContent = GameController.player.jobData.name;
            UIManager.populateAvailableSkillsForPlayer();
            UIManager.renderPlayerSelectedSkills(); // 로드된 스킬로 UI 채우기
        } else {
            UIManager.logToBattleLog("편집할 스킬 세팅을 불러오는데 실패했습니다.", "system");
        }
    },
    
    handleEmptySlotClick(slotIndex) {
        console.log(`빈 슬롯 ${slotIndex + 1} 클릭 처리 시작`);
        GameController.currentSkillSetSlotToSave = slotIndex; 
        GameController.selectedPlayerJobKey = null; 
        GameController.player = null; 

        // 직업 선택 화면으로 전환
        UIManager.showScreen(UIManager.elements.jobSelectionScreen);
        UIManager.populateJobSelectionForPlayer();
        UIManager.elements.confirmJobButton.disabled = true;
        UIManager.elements.confirmJobButton.classList.add('disabled-button');

        // 안내 메시지 표시
        UIManager.elements.authMessage.textContent = `새 스킬 세팅을 만들기 위해 직업을 선택해주세요.`;
        UIManager.elements.authMessage.classList.remove('text-red-400');
        UIManager.elements.authMessage.classList.add('text-yellow-400');
    },


    async deleteSkillSet(slotIndex) {
        if (!GameController.currentUser) return;
        const setToDelete = GameController.playerSkillSets[slotIndex];
        if (!setToDelete) {
            UIManager.logToBattleLog("삭제할 스킬 세팅이 없습니다.", "system");
            return;
        }
        const confirmation = confirm("정말 삭제하시겠습니까?");
        if (confirmation) {
            await FirebaseService.deleteSkillSetting(GameController.currentUser.uid, slotIndex);
            UIManager.logToBattleLog(`"${setToDelete.name}" 스킬 세팅이 삭제되었습니다.`, "system");
            await GameController.loadUserSkillSets();
            GameController.activateSkillSet(GameController.activeSkillSetIndex, false);
            UIManager.showScreen(UIManager.elements.skillManagementScreen);
        }
    },

    resetGame() {
        console.log('[GameController.resetGame] 진입');
        // 게임 상태 초기화
        this.player = null;
        this.opponent = null;
        this.selectedPlayerJobKey = null;
        this.currentSkillSetSlotToSave = null;
        this.activeSkillSetIndex = null;
        // UI를 대전 준비 화면으로 전환
        UIManager.showScreen(UIManager.elements.skillManagementScreen);
        // 배틀 로그 초기화
        if (UIManager.elements.battleLog) {
            UIManager.elements.battleLog.innerHTML = '';
        }
        // 게임오버(승리/패배) 모달 숨기기
        if (typeof UIManager.hideGameOverModal === 'function') {
            UIManager.hideGameOverModal();
        }
    },
};

// GameController를 window 객체에 등록
window.GameController = GameController;