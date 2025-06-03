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
        EventHandler.initialize(); 
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
        if (this.currentUser) {
            this.playerSkillSets = await FirebaseService.loadAllSkillSettings(this.currentUser.uid);
            UIManager.renderSkillSetSlots(this.playerSkillSets || Array(GameConfig.MAX_SKILL_SETS).fill(null), this.activeSkillSetIndex);
            
            let activeSetFound = false;
            if (this.playerSkillSets && this.activeSkillSetIndex !== null && this.playerSkillSets[this.activeSkillSetIndex]) {
                 await this.activateSkillSet(this.activeSkillSetIndex, false);
                 activeSetFound = true;
            } else {
                const firstValidSetIndex = this.playerSkillSets.findIndex(s => s && GameData.jobs[s.jobKey]?.isActive);
                if (firstValidSetIndex !== -1) {
                    await this.activateSkillSet(firstValidSetIndex, false);
                    activeSetFound = true;
                }
            }

            if (!activeSetFound) {
                this.player = null; 
                UIManager.updateSkillSetPreview(null);
                // 만약 활성화할 세팅이 아예 없다면, 직업 선택 화면으로 유도할 수도 있습니다.
                // 또는 skillManagementScreen에서 빈 슬롯 클릭을 유도합니다.
                console.log("활성화할 스킬 세팅이 없습니다. 새 세팅을 만들어주세요.");
            }
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
        if (this.activeSkillSetIndex === null || !this.playerSkillSets[this.activeSkillSetIndex]) {
            UIManager.logToBattleLog("매칭을 시작하려면 먼저 사용할 스킬 세팅을 선택해주세요.", "system");
            return;
        }
        await this.activateSkillSet(this.activeSkillSetIndex, false); 

        if (!this.player || !this.player.selectedSkills.some(s => s !== null)) {
             UIManager.logToBattleLog("활성화된 세팅에 스킬이 없습니다.", "system");
            return;
        }
        BattleController.initializeBattle();
    },


    addSkillToPlayerFirstEmptySlot(skillKey) {
        if (!this.player) { 
            UIManager.logToBattleLog("먼저 직업을 선택해주세요.", "system");
            UIManager.showScreen(UIManager.elements.jobSelectionScreen);
            return;
        }
        const emptySlotIndex = this.player.selectedSkills.findIndex(s => s === null);
        if (emptySlotIndex !== -1 && emptySlotIndex < GameConfig.MAX_SKILL_SLOTS) {
            if (this.player.addSkill(skillKey, emptySlotIndex)) {
                UIManager.renderPlayerSelectedSkills(); 
            }
        } else {
            UIManager.logToBattleLog(`모든 스킬 슬롯이 찼거나 슬롯 인덱스가 유효하지 않습니다. (클릭으로 제거)`, 'system');
        }
    },

    promptSaveSkillSet(slotIndex) { 
        if (!this.player || !this.player.selectedSkills.some(s => s !== null)) {
            UIManager.logToBattleLog("저장할 스킬 구성이 없습니다. 먼저 스킬을 배치해주세요.", "system");
            this.currentSkillSetSlotToSave = slotIndex; 
            UIManager.showScreen(UIManager.elements.skillSelectionScreen);
            if (this.player) { 
                 UIManager.elements.playerJobName.textContent = this.player.jobData.name;
                 UIManager.populateAvailableSkillsForPlayer();
                 UIManager.renderPlayerSelectedSkills();
            } else { 
                 UIManager.showScreen(UIManager.elements.jobSelectionScreen);
                 UIManager.populateJobSelectionForPlayer();
            }
            return;
        }
        this.currentSkillSetSlotToSave = slotIndex; 
        UIManager.showSkillSetNameModal();
    },
    
    async saveCurrentSkillsToNewSlot() { 
        if (!this.currentUser || !this.player || !this.player.selectedSkills.some(s => s !== null)) {
            UIManager.logToBattleLog("저장할 스킬 구성이 없거나 로그인되지 않았습니다.", "system");
            return;
        }
        
        const emptySlotIndex = this.playerSkillSets.findIndex(set => set === null);

        if (emptySlotIndex === -1) {
            UIManager.logToBattleLog("모든 스킬 세팅 슬롯이 사용 중입니다. 기존 세팅을 삭제 후 시도해주세요.", "system");
            return;
        }
        this.promptSaveSkillSet(emptySlotIndex);
    },


    async confirmSaveSkillSetName() {
        const setName = UIManager.elements.skillSetNameInput.value.trim();
        if (!setName) {
            UIManager.logToBattleLog("세팅 이름을 입력해주세요.", "system");
            return;
        }
        if (this.currentUser && this.player && this.currentSkillSetSlotToSave !== null) {
            const skillSetData = {
                name: setName,
                jobKey: this.player.jobKey,
                skills: this.player.selectedSkills.map(s => s ? s.skillKey : null), 
                upkeep: this.player.currentUpkeep,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await FirebaseService.saveSkillSetting(this.currentUser.uid, this.currentSkillSetSlotToSave, skillSetData);
            UIManager.hideSkillSetNameModal();
            UIManager.logToBattleLog(`"${setName}" 스킬 세팅이 슬롯 ${this.currentSkillSetSlotToSave + 1}에 저장되었습니다.`, "system");
            
            await this.loadUserSkillSets(); 
            this.activateSkillSet(this.currentSkillSetSlotToSave, false); 
            UIManager.showScreen(UIManager.elements.skillManagementScreen); 
        }
        this.currentSkillSetSlotToSave = null;
    },
    
    async activateSkillSet(slotIndex, showLog = true) { 
        if (!this.currentUser) return;
        const setToActivate = this.playerSkillSets[slotIndex]; 

        if (setToActivate && GameData.jobs[setToActivate.jobKey]?.isActive) {
            const playerName = this.currentUser?.displayName || this.currentUser?.email?.split('@')[0] || "플레이어";
            this.player = new Player(0, playerName, setToActivate.jobKey, false);
            
            this.player.selectedSkills = Array(GameConfig.MAX_SKILL_SLOTS).fill(null);
            let currentUpkeep = 0;
            if (setToActivate.skills && Array.isArray(setToActivate.skills)) {
                setToActivate.skills.forEach((skillKey, index) => {
                    if (index < GameConfig.MAX_SKILL_SLOTS && skillKey && GameData.allSkills[skillKey]) {
                        const skill = GameData.allSkills[skillKey];
                        this.player.selectedSkills[index] = { skillKey: skillKey, originalUpkeep: skill.upkeep };
                        currentUpkeep += skill.upkeep;
                    }
                });
            }
            this.player.currentUpkeep = currentUpkeep;
            this.selectedPlayerJobKey = setToActivate.jobKey; 
            this.player.activeSkillSetId = setToActivate.id; 
            this.activeSkillSetIndex = slotIndex; 

            if (showLog) UIManager.logToBattleLog(`"${setToActivate.name}" 세팅이 활성화되었습니다.`, "system");
            UIManager.renderSkillSetSlots(this.playerSkillSets, slotIndex); 

        } else {
            if (showLog) UIManager.logToBattleLog("선택한 스킬 세팅을 불러올 수 없거나, 해당 직업이 비활성화 상태입니다.", "system");
        }
    },
    
    async activateAndStartMatch(slotIndex) {
        await this.activateSkillSet(slotIndex, true); 
        if (this.player && this.player.selectedSkills.some(s => s !== null)) {
            this.startMatch(); 
        } else {
            UIManager.logToBattleLog("활성화된 세팅에 스킬이 없어 매칭을 시작할 수 없습니다.", "system");
        }
    },

    async editSkillSet(slotIndex) {
        this.currentSkillSetSlotToSave = slotIndex; // 편집 후 저장될 슬롯 기억
        await this.activateSkillSet(slotIndex, false); // 해당 세팅으로 플레이어 정보 로드

        if (this.player) {
            UIManager.showScreen(UIManager.elements.skillSelectionScreen);
            UIManager.elements.playerJobName.textContent = this.player.jobData.name;
            UIManager.populateAvailableSkillsForPlayer();
            UIManager.renderPlayerSelectedSkills(); // 로드된 스킬로 UI 채우기
        } else {
            UIManager.logToBattleLog("편집할 스킬 세팅을 불러오는데 실패했습니다.", "system");
        }
    },
    
    handleEmptySlotClick(slotIndex) {
        this.currentSkillSetSlotToSave = slotIndex; 
        this.selectedPlayerJobKey = null; 
        this.player = null; 
        UIManager.showScreen(UIManager.elements.jobSelectionScreen);
        UIManager.populateJobSelectionForPlayer();
        UIManager.elements.confirmJobButton.disabled = true;
        UIManager.elements.confirmJobButton.classList.add('disabled-button');
    },


    async deleteSkillSet(slotIndex) {
        if (!this.currentUser) return;
        const setToDelete = this.playerSkillSets[slotIndex];
        if (!setToDelete) {
            UIManager.logToBattleLog("삭제할 스킬 세팅이 없습니다.", "system");
            return;
        }
        const confirmation = confirm(`"${setToDelete.name}" 스킬 세팅을 정말 삭제하시겠습니까?`);
        if (!confirmation) return;

        const success = await FirebaseService.deleteSkillSetting(this.currentUser.uid, slotIndex);
        if (success) {
            UIManager.logToBattleLog(`스킬 세팅 "${setToDelete.name}"이(가) 삭제되었습니다.`, "system");
            this.playerSkillSets[slotIndex] = null; 
            
            if (this.activeSkillSetIndex === slotIndex) { 
                this.activeSkillSetIndex = null;
                this.player = null; 
            }
            UIManager.renderSkillSetSlots(this.playerSkillSets, this.activeSkillSetIndex); 
        } else {
            UIManager.logToBattleLog("스킬 세팅 삭제에 실패했습니다.", "system");
        }
    },


    resetGame() { 
        UIManager.hideGameOverModal(); 
        this.opponent = null;
        BattleController.currentBattleTurn = 1; 
        BattleController.lastPlayerSkillUsed = null;
        BattleController.lastOpponentSkillUsed = null;
        BattleController.isAutoProceedEnabled = false; 
        BattleController.stopAutoProceed();
        
        UIManager.elements.battleLog.innerHTML = ''; 
        
        if (this.currentUser) {
            UIManager.showScreen(UIManager.elements.skillManagementScreen);
            this.loadUserSkillSets(); // 스킬 세팅 다시 로드 및 UI 업데이트
        } else { 
            UIManager.elements.emailInput.value = '';
            UIManager.elements.passwordInput.value = '';
            UIManager.showScreen(UIManager.elements.authScreen); 
        }
    }
};
