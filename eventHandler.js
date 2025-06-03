// --- 모듈: 이벤트 핸들러 ---
const EventHandler = {
    draggedPlayerItem: null, 

    initialize() {
        // DOMContentLoaded 이벤트 리스너 제거하고 직접 초기화
        this.initializeEventListeners();
    },

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // 로그인 버튼
        if (UIManager.elements.loginButton) {
            UIManager.elements.loginButton.addEventListener('click', async () => {
                const email = UIManager.elements.emailInput.value;
                const password = UIManager.elements.passwordInput.value;
                
                if (!email || !password) {
                    UIManager.elements.authMessage.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
                    UIManager.elements.authMessage.classList.add('text-red-400');
                    return;
                }

                UIManager.elements.authMessage.textContent = "로그인 중...";
                UIManager.elements.authMessage.classList.remove('text-red-400');
                UIManager.elements.authMessage.classList.add('text-yellow-400');

                const success = await AuthManager.login(email, password);
                if (success) {
                    UIManager.elements.authMessage.textContent = "로그인 성공!";
                    UIManager.elements.authMessage.classList.remove('text-yellow-400');
                    UIManager.elements.authMessage.classList.add('text-green-400');
                }
            });
        }

        // 회원가입 버튼
        UIManager.elements.signupButton.addEventListener('click', async () => {
            const email = UIManager.elements.emailInput.value;
            const password = UIManager.elements.passwordInput.value;
            
            if (!email || !password) {
                UIManager.elements.authMessage.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
                UIManager.elements.authMessage.classList.add('text-red-400');
                return;
            }

            if (password.length < 6) {
                UIManager.elements.authMessage.textContent = "비밀번호는 6자리 이상이어야 합니다.";
                UIManager.elements.authMessage.classList.add('text-red-400');
                return;
            }

            UIManager.elements.authMessage.textContent = "회원가입 중...";
            UIManager.elements.authMessage.classList.remove('text-red-400');
            UIManager.elements.authMessage.classList.add('text-yellow-400');

            const success = await AuthManager.signup(email, password);
            if (success) {
                UIManager.elements.authMessage.textContent = "회원가입 성공! 자동으로 로그인됩니다.";
                UIManager.elements.authMessage.classList.remove('text-yellow-400');
                UIManager.elements.authMessage.classList.add('text-green-400');
            }
        });

        // 로그아웃 버튼
        UIManager.elements.logoutButton.addEventListener('click', () => {
            AuthManager.logout();
        });

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
        console.log('Setting up startMatchButton event listener...');
        const startMatchButton = document.getElementById('startMatchButton');
        console.log('startMatchButton element retrieved by ID:', startMatchButton);

        if (startMatchButton) {
            console.log('startMatchButton found, attempting to add event listener.');
            // 기존 이벤트 리스너 제거
            const newStartMatchHandler = () => {
                console.log('[startMatch] 호출됨, activeSkillSetIndex: ' + GameController.activeSkillSetIndex);
                GameController.startMatch();
            };
            startMatchButton.removeEventListener('click', newStartMatchHandler);
            startMatchButton.addEventListener('click', newStartMatchHandler);
            console.log('Event listener added to startMatchButton.');
        } else {
            console.error('startMatchButton이 null입니다!');
        }

        // 스킬 세팅 이름 입력 모달 버튼
        UIManager.elements.confirmSaveSkillSetNameButton.addEventListener('click', () => GameController.confirmSaveSkillSetName());
        UIManager.elements.cancelSaveSkillSetNameButton.addEventListener('click', () => UIManager.hideSkillSetNameModal());

        // 전투 관련 버튼 이벤트 리스너 등록
        console.log('Initializing Battle Screen event listeners...');

        // 다음 턴 버튼
        const nextRoundButton = document.getElementById('nextRoundButton');
        if (nextRoundButton) {
            console.log('nextRoundButton found in eventHandler.', nextRoundButton.id, nextRoundButton.tagName, nextRoundButton);
            nextRoundButton.removeEventListener('click', BattleController.processRoundActions); // 중복 방지
            nextRoundButton.addEventListener('click', () => BattleController.processRoundActions());
        } else {
            console.error('Error: nextRoundButton element not found in eventHandler!');
        }

        // 자동 진행 토글 스위치
        const autoProceedToggle = document.getElementById('autoProceedToggle');
        if (autoProceedToggle) {
            console.log('autoProceedToggle found in eventHandler.', autoProceedToggle.id, autoProceedToggle.tagName, autoProceedToggle);
            autoProceedToggle.removeEventListener('change', BattleController.toggleAutoProceed); // 중복 방지
            autoProceedToggle.addEventListener('change', () => BattleController.toggleAutoProceed());
        } else {
            console.error('Error: autoProceedToggle element not found in eventHandler!');
        }

        // 대전 준비 화면으로 버튼 (게임 오버 모달)
        const restartGameButton = document.getElementById('restartGameButton');
        if (restartGameButton) {
             console.log('restartGameButton found in eventHandler.', restartGameButton.id, restartGameButton.tagName, restartGameButton);
             restartGameButton.removeEventListener('click', GameController.resetGame); // 중복 방지
             restartGameButton.addEventListener('click', () => {
                 console.log('restartGameButton clicked. Calling GameController.resetGame()...'); // 클릭 로그 추가
                 GameController.resetGame();
             }); 
        } else {
            console.error('Error: restartGameButton element not found in eventHandler!');
        }

        // Upkeep 경고 모달 버튼
        const confirmProceedButton = document.getElementById('confirmProceedButton');
        if (confirmProceedButton) {
            console.log('confirmProceedButton found in eventHandler.', confirmProceedButton);
            confirmProceedButton.removeEventListener('click', () => { UIManager.hideUpkeepWarning(); GameController.confirmSkillSetup(); }); // 중복 방지
            confirmProceedButton.addEventListener('click', () => {
                UIManager.hideUpkeepWarning(); 
                GameController.confirmSkillSetup(); 
            });
        } else {
            console.error('Error: confirmProceedButton element not found in eventHandler!');
        }

        const cancelProceedButton = document.getElementById('cancelProceedButton');
        if (cancelProceedButton) {
            console.log('cancelProceedButton found in eventHandler.', cancelProceedButton);
            cancelProceedButton.removeEventListener('click', () => UIManager.hideUpkeepWarning()); // 중복 방지
            cancelProceedButton.addEventListener('click', () => {
                UIManager.hideUpkeepWarning(); 
            });
        } else {
            console.error('Error: cancelProceedButton element not found in eventHandler!');
        }
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
