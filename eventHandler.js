// --- 모듈: 이벤트 핸들러 ---
const EventHandler = {
    draggedPlayerItem: null, 

    initialize() {
        // 인증 관련 버튼
        UIManager.elements.loginButton.addEventListener('click', () => AuthManager.login());
        UIManager.elements.signupButton.addEventListener('click', () => AuthManager.signup());
        UIManager.elements.logoutButton.addEventListener('click', () => AuthManager.logout());

        // 게임 흐름 관련 버튼
        UIManager.elements.confirmJobButton.addEventListener('click', () => GameController.confirmPlayerJob());
        UIManager.elements.confirmSkillSetupButton.addEventListener('click', () => { 
             const remainingUpkeep = GameConfig.MAX_UPKEEP - GameController.player.currentUpkeep;
            if (remainingUpkeep >= 30 && GameController.player.selectedSkills.some(s => s !== null)) { 
                UIManager.showUpkeepWarning(remainingUpkeep);
            } else {
                GameController.confirmSkillSetup();
            }
        }); 
        
        // 스킬 세팅 관리 화면 버튼
        UIManager.elements.startMatchButton.addEventListener('click', () => GameController.startMatch());
        UIManager.elements.editCurrentSkillSetButton.addEventListener('click', () => GameController.editCurrentSkillSet());
        UIManager.elements.saveCurrentSkillsButton.addEventListener('click', () => GameController.saveCurrentSkillsToNewSlot());

        // 스킬 세팅 이름 입력 모달 버튼
        UIManager.elements.confirmSaveSkillSetNameButton.addEventListener('click', () => GameController.confirmSaveSkillSetName());
        UIManager.elements.cancelSaveSkillSetNameButton.addEventListener('click', () => UIManager.hideSkillSetNameModal());


        // 전투 관련 버튼
        UIManager.elements.nextRoundButton.addEventListener('click', () => BattleController.processRoundActions());
        UIManager.elements.restartGameButton.addEventListener('click', () => GameController.resetGame()); 
        
        // Upkeep 경고 모달 버튼
        UIManager.elements.confirmProceedButton.addEventListener('click', () => {
            UIManager.hideUpkeepWarning(); 
            GameController.confirmSkillSetup(); 
        });
        UIManager.elements.cancelProceedButton.addEventListener('click', () => {
            UIManager.hideUpkeepWarning(); 
        });

        // 자동 진행 토글 스위치
        UIManager.elements.autoProceedToggle.addEventListener('change', () => BattleController.toggleAutoProceed());
    },

    addDragEventsToSkillCard(skillCardElement) { 
        skillCardElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', skillCardElement.dataset.skillKey);
            e.dataTransfer.effectAllowed = "copyMove";
            skillCardElement.classList.add('dragging');
        });
        skillCardElement.addEventListener('dragend', (e) => {
            skillCardElement.classList.remove('dragging');
        });
    },
    
    addDragEventsToSingleSkillSlot(slotElement) {
        slotElement.draggable = true;
        slotElement.addEventListener('dragstart', (e) => {
            if (slotElement.dataset.skillKey) {
                this.draggedPlayerItem = slotElement;
                e.dataTransfer.setData('text/plain', slotElement.dataset.skillKey); 
                e.dataTransfer.setData('sourceSlotIndex', slotElement.dataset.slotIndex);
                e.dataTransfer.effectAllowed = "move";
                setTimeout(() => slotElement.classList.add('dragging'), 0);
            } else {
                e.preventDefault();
            }
        });
        slotElement.addEventListener('dragend', (e) => {
            if (this.draggedPlayerItem) {
                this.draggedPlayerItem.classList.remove('dragging');
                this.draggedPlayerItem = null;
            }
        });
        slotElement.addEventListener('dragover', (e) => { e.preventDefault(); });
        slotElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetSlot = e.currentTarget;
            const targetSlotIndex = parseInt(targetSlot.dataset.slotIndex);
            const droppedSkillKey = e.dataTransfer.getData('text/plain');
            const sourceSlotIndexStr = e.dataTransfer.getData('sourceSlotIndex');

            if (sourceSlotIndexStr) { 
                if (this.draggedPlayerItem && this.draggedPlayerItem !== targetSlot) {
                    const sourceSlotIndex = parseInt(sourceSlotIndexStr);
                    const sourceSkillData = GameController.player.selectedSkills[sourceSlotIndex];
                    const targetSkillData = GameController.player.selectedSkills[targetSlotIndex];
                    GameController.player.selectedSkills[targetSlotIndex] = sourceSkillData;
                    GameController.player.selectedSkills[sourceSlotIndex] = targetSkillData;
                    UIManager.renderPlayerSelectedSkills();
                }
            } else if (GameData.allSkills[droppedSkillKey]) { 
                if (GameController.player.selectedSkills[targetSlotIndex]) {
                    GameController.player.removeSkill(targetSlotIndex);
                }
                if (GameController.player.addSkill(droppedSkillKey, targetSlotIndex)) {
                    UIManager.renderPlayerSelectedSkills();
                }
            }
            if (this.draggedPlayerItem) this.draggedPlayerItem.classList.remove('dragging');
            this.draggedPlayerItem = null;
        });
    }
};
