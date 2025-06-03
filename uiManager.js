// --- 모듈: UI 관리 ---
const UIManager = {
    elements: {},

    initializeElements() {
        this.elements = {
            gameContainer: document.querySelector('.game-container'),
            authScreen: document.getElementById('authScreen'), 
            emailInput: document.getElementById('emailInput'), 
            passwordInput: document.getElementById('passwordInput'), 
            loginButton: document.getElementById('loginButton'),
            signupButton: document.getElementById('signupButton'), 
            authMessage: document.getElementById('authMessage'), 
            logoutButton: document.getElementById('logoutButton'), 

            jobSelectionScreen: document.getElementById('jobSelectionScreen'),
            playerJobSelect: document.getElementById('playerJobSelect'),
            confirmJobButton: document.getElementById('confirmJobButton'),
            
            skillSelectionScreen: document.getElementById('skillSelectionScreen'),
            playerJobName: document.getElementById('playerJobName'),
            playerAvailableSkills: document.getElementById('playerAvailableSkills'),
            playerSelectedSkillsContainer: document.getElementById('playerSelectedSkills'),
            playerUpkeepDisplay: document.getElementById('playerUpkeep'),
            confirmSkillSetupButton: document.getElementById('confirmSkillSetupButton'), 

            skillManagementScreen: document.getElementById('skillManagementScreen'), 
            skillSetSlotsContainer: document.getElementById('skillSetSlotsContainer'), 
            saveCurrentSkillsButton: document.getElementById('saveCurrentSkillsButton'), 
            startMatchButton: document.getElementById('startMatchButton'), 
            editCurrentSkillSetButton: document.getElementById('editCurrentSkillSetButton'), 
            currentPlayerNameDisplay_manage: document.getElementById('currentPlayerNameDisplay_manage'), 

            battleScreen: document.getElementById('battleScreen'),
            playerNameDisplay: document.getElementById('playerNameDisplay'),
            playerHp: document.getElementById('playerHp'),
            playerMaxHp: document.getElementById('playerMaxHp'),
            playerHpBar: document.getElementById('playerHpBar'),
            playerStatus: document.getElementById('playerStatus'), 
            playerJobImage: document.getElementById('playerJobImage'),
            playerCurrentSkill: document.getElementById('playerCurrentSkill'), 
            opponentNameDisplay: document.getElementById('opponentNameDisplay'),
            opponentHp: document.getElementById('opponentHp'), 
            opponentMaxHp: document.getElementById('opponentMaxHp'), 
            opponentHpBar: document.getElementById('opponentHpBar'),
            opponentStatus: document.getElementById('opponentStatus'), 
            opponentJobImage: document.getElementById('opponentJobImage'),
            opponentCurrentSkill: document.getElementById('opponentCurrentSkill'), 
            roundInfoDisplay: document.getElementById('roundInfo'),
            nextRoundButton: document.getElementById('nextRoundButton'),
            battleLog: document.getElementById('battleLog'),
            gameOverModal: document.getElementById('gameOverModal'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            gameOverMessage: document.getElementById('gameOverMessage'),
            gameOverSkillInfo: document.getElementById('gameOverSkillInfo'),
            restartGameButton: document.getElementById('restartGameButton'),
            upkeepWarningModal: document.getElementById('upkeepWarningModal'),
            upkeepWarningText: document.getElementById('upkeepWarningText'),
            confirmProceedButton: document.getElementById('confirmProceedButton'),
            cancelProceedButton: document.getElementById('cancelProceedButton'),
            autoProceedToggle: document.getElementById('autoProceedToggle'),
            autoProceedStatus: document.getElementById('autoProceedStatus'),
            playerSkillDescription: document.getElementById('playerSkillDescription'), 
            opponentSkillDescription: document.getElementById('opponentSkillDescription'), 
            skillSetNameModal: document.getElementById('skillSetNameModal'), 
            skillSetNameInput: document.getElementById('skillSetNameInput'),
            confirmSaveSkillSetNameButton: document.getElementById('confirmSaveSkillSetNameButton'),
            cancelSaveSkillSetNameButton: document.getElementById('cancelSaveSkillSetNameButton'),
            battleLogToggle: document.getElementById('battleLogToggle'),
            battleLogStatus: document.getElementById('battleLogStatus'),
            battleLogContainer: document.getElementById('battleLogContainer'),
            playerBattleSkills: Array.from({length: 6}, (_, i) => document.getElementById(`playerBattleSkill${i + 1}`)),
            opponentBattleSkills: Array.from({length: 6}, (_, i) => document.getElementById(`opponentBattleSkill${i + 1}`)),
        };
        console.log('UI Elements initialized:', this.elements);
        console.log('nextRoundButton in UIManager.elements:', this.elements.nextRoundButton);
        console.log('autoProceedToggle in UIManager.elements:', this.elements.autoProceedToggle);
        // 전투 로그 관련 요소 초기화
        if (this.elements.battleLogContainer) {
            this.elements.battleLogContainer.classList.add('hidden');
            if (this.elements.battleLogStatus) {
                this.elements.battleLogStatus.textContent = 'OFF';
            }
        }
    },

    initializeEventListeners() {
        // 전투 로그 토글 이벤트
        if (this.elements.battleLogToggle) {
            this.elements.battleLogToggle.addEventListener('change', (e) => {
                const isVisible = e.target.checked;
                this.elements.battleLogContainer.classList.toggle('hidden', !isVisible);
                this.elements.battleLogStatus.textContent = isVisible ? 'ON' : 'OFF';
            });
        }
    },

    showScreen(screenElement) {
        this.elements.authScreen.classList.add('hidden');
        this.elements.jobSelectionScreen.classList.add('hidden');
        this.elements.skillSelectionScreen.classList.add('hidden');
        this.elements.skillManagementScreen.classList.add('hidden'); 
        this.elements.battleScreen.classList.add('hidden');
        
        this.elements.jobSelectionScreen.classList.remove('flex','flex-col');
        this.elements.skillSelectionScreen.classList.remove('flex','flex-col');
        this.elements.skillManagementScreen.classList.remove('flex','flex-col'); 
        this.elements.battleScreen.classList.remove('flex','flex-col');

        screenElement.classList.remove('hidden');
        if (screenElement !== this.elements.authScreen) { 
             screenElement.classList.add('flex', 'flex-col');
        }
    },

    updateBattlePlayerUI(targetPlayer) { 
        const prefix = targetPlayer === GameController.player ? 'player' : 'opponent';
        const nameDisplayEl = this.elements[`${prefix}NameDisplay`];
        if (nameDisplayEl) nameDisplayEl.textContent = `${targetPlayer.name} (${targetPlayer.jobData.name})`;

        const jobImageEl = this.elements[`${prefix}JobImage`];
        if (jobImageEl) jobImageEl.src = targetPlayer.jobData.icon;
        
        const hpEl = this.elements[`${prefix}Hp`];
        if (hpEl) hpEl.textContent = targetPlayer.hp;

        const maxHpEl = this.elements[`${prefix}MaxHp`];
        if (maxHpEl) maxHpEl.textContent = targetPlayer.maxHp;

        const hpBarEl = this.elements[`${prefix}HpBar`];
        if (hpBarEl) {
            const hpPercentage = (targetPlayer.hp / targetPlayer.maxHp) * 100;
            hpBarEl.style.width = `${hpPercentage}%`;
        }
        
        let statusText = "정상";
        const effectsToShow = [];
        const statusEffectsData = [];

        targetPlayer.buffs.forEach(b => effectsToShow.push({ type: b.type, name: GameData.allSkills[b.skillKey]?.name || b.type, duration: b.duration, isBuff: true }));
        targetPlayer.debuffs.forEach(d => effectsToShow.push({ type: d.type, name: GameData.allSkills[d.skillKey]?.name || d.type, duration: d.duration, isBuff: false }));
        targetPlayer.statusEffects.forEach(s => effectsToShow.push({ type: s.type, name: s.type, duration: s.duration, isStatus: true }));

        if (effectsToShow.length > 0) {
            statusText = effectsToShow.map(effect => {
                let name = effect.name;
                let duration = `${effect.duration}턴`;
                let colorClass = 'text-gray-400'; // 기본 색상
                let prefix = '';
                let suffix = '';

                if (effect.isBuff) {
                    colorClass = 'text-green-400'; // 버프 색상
                } else if (effect.isStatus) {
                    // 상태 이상 종류별 색상 및 아이콘
                    switch(effect.type) {
                        case 'bleed': 
                            colorClass = 'text-pink-400'; // 출혈: 핑크
                            break;
                        case 'poison': 
                            colorClass = 'text-lime-400'; // 독: 연두색 계열
                            break;
                        case 'stun': // 기절
                        case 'paralysis': // 마비
                            colorClass = 'text-yellow-400'; // 마비/기절: 노랑
                            prefix = '⚡ '; // 마비/기절 아이콘 (번개)
                            suffix = ' ⚡';
                            break;
                        case 'polymorph': // 양 변이
                            name = '양 변이';
                            colorClass = 'text-purple-400'; // 양 변이: 보라
                            break;
                        case 'silence': // 침묵
                            colorClass = 'text-orange-400'; // 침묵: 주황
                            break;
                        case 'blind': // 실명
                            colorClass = 'text-gray-500'; // 실명: 어두운 회색
                            break;
                        // 기타 상태 이상 기본 색상 유지 또는 추가 정의
                        default:
                             colorClass = 'text-red-400'; // 디버프/상태 이상 기본 빨강
                             break;
                    }
                } else { // 일반 디버프
                     colorClass = 'text-red-400'; // 일반 디버프: 빨강
                }

                return `<span class="${colorClass}">${prefix}${name}(${duration})${suffix}</span>`;
            }).join(', ');
        } else {
            statusText = `<span class="text-gray-400">정상</span>`; // 정상 상태도 색상 적용
        }
        
        const statusEl = this.elements[`${prefix}Status`];
        if (statusEl) statusEl.innerHTML = `상태: ${statusText}`;
    },

    logToBattleLog(message, type = 'info') {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${message}`;
        logEntry.classList.add('log-entry', 'rounded', 'px-1', 'py-0.5'); 
        switch(type) {
            case 'damage': logEntry.classList.add('text-red-300'); break;
            case 'heal': logEntry.classList.add('text-green-300'); break;
            case 'effect': logEntry.classList.add('text-yellow-300'); break;
            case 'status': logEntry.classList.add('text-purple-300'); break;
            case 'system': logEntry.classList.add('text-blue-300'); break;
            default: logEntry.classList.add('text-gray-300');
        }
        this.elements.battleLog.appendChild(logEntry);
        this.elements.battleLog.scrollTop = this.elements.battleLog.scrollHeight; 
    },
    
    displayCurrentRoundSkill(targetPlayer, skillName, skillDescription = "") {
        const prefix = targetPlayer === GameController.player ? 'player' : 'opponent';
        const skillNameEl = this.elements[`${prefix}CurrentSkill`];
        const skillDescEl = this.elements[`${prefix}SkillDescription`];

        if(skillNameEl) skillNameEl.textContent = skillName ? `선택: ${skillName}` : '';
        if(skillDescEl) skillDescEl.textContent = skillDescription;
    },
    
    triggerScreenEffect(effectType) {
        this.elements.gameContainer.classList.remove('screen-shake', 'screen-flash-red', 'screen-flash-blue'); 
        void this.elements.gameContainer.offsetWidth; 
        if (effectType === 'shake') this.elements.gameContainer.classList.add('screen-shake');
        else if (effectType === 'flash-red') this.elements.gameContainer.classList.add('screen-flash-red');
        else if (effectType === 'flash-blue') this.elements.gameContainer.classList.add('screen-flash-blue');
        
        setTimeout(() => {
            this.elements.gameContainer.classList.remove('screen-shake', 'screen-flash-red', 'screen-flash-blue');
        }, 300); 
    },

    populateJobSelectionForPlayer() {
        this.elements.playerJobSelect.innerHTML = '';
        Object.keys(GameData.jobs).forEach(jobKey => {
            const job = GameData.jobs[jobKey];
            const card = document.createElement('div');
            let cardClasses = `job-card p-2 rounded-lg shadow-md cursor-pointer transition-all flex flex-col items-center h-full ${job.bgColorClass}`;
            if (!job.isActive) {
                cardClasses = `job-card p-2 rounded-lg shadow-md cursor-not-allowed transition-all flex flex-col items-center h-full bg-gray-600 opacity-50`; 
            }
            card.className = cardClasses;
            card.innerHTML = `
                <img src="${job.icon}" alt="${job.name}" class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 rounded-full border-2 border-gray-300">
                <h4 class="text-sm sm:text-base font-semibold text-center ${job.isActive ? 'text-white' : 'text-gray-400'}">${job.name}</h4>
                <p class="text-xs ${job.isActive ? 'text-gray-200' : 'text-gray-400'} text-center mt-0.5 skill-description flex-grow">${job.description}</p>
                <p class="text-xs ${job.isActive ? 'text-gray-200' : 'text-gray-400'} text-center mt-0.5 skill-description">HP: ${job.baseHp}</p>
                <p class="text-xs ${job.isActive ? 'text-gray-200' : 'text-gray-400'} text-center mt-0.5 skill-description">패시브: ${job.passive}</p>
            `;
            if (job.isActive) {
                card.addEventListener('click', () => GameController.selectPlayerJob(jobKey, card));
            }
            this.elements.playerJobSelect.appendChild(card);
        });
    },

    populateAvailableSkillsForPlayer() {
        this.elements.playerAvailableSkills.innerHTML = '';
        const jobSkills = GameController.player.jobData.availableSkills;
        jobSkills.forEach(skillKey => {
            const skill = GameData.allSkills[skillKey];
            const skillCard = document.createElement('div');
            skillCard.className = 'skill-card bg-gray-500 p-1 rounded shadow cursor-pointer hover:bg-gray-400 min-h-[50px]';
            skillCard.draggable = true; 
            skillCard.dataset.skillKey = skillKey;
            skillCard.innerHTML = `
                <h5 class="font-semibold text-xs text-indigo-200 whitespace-normal">${skill.name} (U: ${skill.upkeep})</h5>
                <p class="skill-description mt-0.5">${skill.description}</p> 
            `;
            skillCard.addEventListener('click', (event) => { 
                event.preventDefault(); 
                GameController.addSkillToPlayerFirstEmptySlot(skillKey);
            });
            EventHandler.addDragEventsToSkillCard(skillCard);
            this.elements.playerAvailableSkills.appendChild(skillCard);
        });
    },

    renderPlayerSelectedSkills() {
        if (this.elements.playerSelectedSkillsContainer.children.length !== GameConfig.MAX_SKILL_SLOTS) {
            this.elements.playerSelectedSkillsContainer.innerHTML = ''; 
            for (let i = 0; i < GameConfig.MAX_SKILL_SLOTS; i++) {
                const slotDiv = document.createElement('div');
                slotDiv.className = "selected-skill-slot p-1 rounded bg-gray-500 flex items-center justify-center text-xs text-center";
                slotDiv.dataset.slotIndex = i;
                slotDiv.textContent = `${i + 1}`;
                this.elements.playerSelectedSkillsContainer.appendChild(slotDiv);
                EventHandler.addDragEventsToSingleSkillSlot(slotDiv); 
                slotDiv.addEventListener('click', (event) => { 
                    event.preventDefault();
                    if (slotDiv.dataset.skillKey && GameController.player) {
                        GameController.player.removeSkill(parseInt(slotDiv.dataset.slotIndex));
                        this.renderPlayerSelectedSkills();
                    }
                });
            }
        }

        Array.from(this.elements.playerSelectedSkillsContainer.children).forEach((slotDiv, i) => {
            const skillData = GameController.player.selectedSkills[i];
            if (skillData) {
                const skill = GameData.allSkills[skillData.skillKey];
                slotDiv.innerHTML = `<div class="text-center overflow-hidden w-full">
                    <p class="font-bold text-xs whitespace-normal">${skill.name}</p>
                    <p class="text-xs skill-description" style="font-size:0.6rem;">U:${skill.upkeep}</p>
                </div>`;
                slotDiv.classList.remove('bg-gray-500', 'text-xs');
                slotDiv.classList.add('bg-indigo-500', 'text-white');
                slotDiv.dataset.skillKey = skillData.skillKey; 
            } else {
                slotDiv.innerHTML = `${i + 1}`;
                slotDiv.classList.remove('bg-indigo-500', 'text-white');
                slotDiv.classList.add('bg-gray-500', 'text-xs');
                delete slotDiv.dataset.skillKey; 
            }
        });
        if(GameController.player) GameController.player.updateUpkeepDisplay();
    },
    
    renderSkillSetSlots(skillSets = [], activeSlotIndex = null) { 
        this.elements.skillSetSlotsContainer.innerHTML = '';
        for (let i = 0; i < GameConfig.MAX_SKILL_SETS; i++) {
            const set = skillSets[i]; 
            const slotEl = document.createElement('div');
            let slotBaseClasses = 'p-3 rounded-lg shadow-md border cursor-pointer transition-all ';
            
            let setName = `세팅 ${i + 1}`;
            let skillsDisplay = '비어있음 - 클릭하여 새 세팅 만들기';
            let upkeepDisplay = '';
            let jobDisplay = '';
            let actionButtonsHTML = ''; 

            if (set) {
                setName = set.name || `세팅 ${i + 1}`;
                skillsDisplay = (set.skills && Array.isArray(set.skills)) ? set.skills.map(sKey => GameData.allSkills[sKey]?.name || '?').join(', ') : '스킬 정보 없음';
                if (skillsDisplay.length > 50) skillsDisplay = skillsDisplay.substring(0, 47) + "..."; 
                upkeepDisplay = `Upkeep: ${set.upkeep || '?'}`;
                jobDisplay = `직업: ${GameData.jobs[set.jobKey]?.name || '알 수 없음'}`;
                slotBaseClasses += 'border-gray-600 hover:border-indigo-500 bg-gray-800'; 
                actionButtonsHTML = `
                    <div class="flex space-x-2 mt-2">
                        <button data-slot-index="${i}" class="edit-set-button text-xs bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded flex-1">편집</button>
                        <button data-slot-index="${i}" class="delete-set-button text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded flex-1">삭제</button>
                    </div>`;
                slotEl.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) { 
                        GameController.activeSkillSetIndex = i; // 명시적으로 갱신
                        GameController.activateSkillSet(i, true); // 선택/활성화만!
                        // 매칭 시작 버튼 활성화
                        if (UIManager.elements.startMatchButton) {
                            UIManager.elements.startMatchButton.disabled = false;
                            UIManager.elements.startMatchButton.classList.remove('disabled-button', 'bg-gray-400');
                            UIManager.elements.startMatchButton.classList.add('bg-red-600', 'hover:bg-red-700');
                        }
                        UIManager.renderSkillSetSlots(skillSets, i);
                    }
                });
            } else {
                slotBaseClasses += 'border-gray-500 hover:border-green-500 bg-gray-600';
                slotEl.addEventListener('click', () => {
                    console.log(`빈 슬롯 ${i + 1} 클릭됨`);
                    GameController.handleEmptySlotClick(i);
                });
            }

            if (i === activeSlotIndex && set) { 
                slotBaseClasses += ' border-indigo-500 ring-2 ring-indigo-400';
            }
            
            slotEl.className = slotBaseClasses;
            slotEl.innerHTML = `
                <h4 class="text-base font-semibold ${set ? 'text-indigo-300' : 'text-gray-400'} mb-1">${setName}</h4>
                <p class="text-xs text-gray-400">${jobDisplay}</p>
                <p class="text-xs text-gray-300 mb-1 h-8 overflow-hidden">${skillsDisplay}</p>
                <p class="text-xs text-gray-400 mb-2">${upkeepDisplay}</p>
                ${actionButtonsHTML}
            `;
            this.elements.skillSetSlotsContainer.appendChild(slotEl);

            if (set) {
                slotEl.querySelector('.edit-set-button')?.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    GameController.editSkillSet(i);
                });
                slotEl.querySelector('.delete-set-button')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    GameController.deleteSkillSet(i);
                });
            }
        }
    },

    showUpkeepWarning(remainingUpkeep) {
        this.elements.upkeepWarningText.textContent = `UPKEEP이 ${remainingUpkeep} 만큼 남았습니다. 정말 세팅을 완료하시겠습니까?`;
        this.elements.upkeepWarningModal.classList.remove('hidden');
        this.elements.upkeepWarningModal.classList.add('flex');
    },

    hideUpkeepWarning() {
        this.elements.upkeepWarningModal.classList.add('hidden');
        this.elements.upkeepWarningModal.classList.remove('flex');
    },
    
    showSkillSetNameModal() {
        this.elements.skillSetNameInput.value = ''; 
        this.elements.skillSetNameModal.classList.remove('hidden');
        this.elements.skillSetNameModal.classList.add('flex');
    },

    hideSkillSetNameModal() {
        this.elements.skillSetNameModal.classList.add('hidden');
        this.elements.skillSetNameModal.classList.remove('flex');
    },


    showGameOverModal(winner, lastPlayerSkill, lastOpponentSkill) {
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.gameOverModal.classList.add('flex');

        if (winner) {
            if (winner === GameController.player) { 
                this.elements.gameOverTitle.textContent = "승리!";
                this.elements.gameOverTitle.className = "text-2xl sm:text-3xl font-bold mb-3 text-green-400";
                this.elements.gameOverMessage.textContent = `${GameController.opponent.name}에게 승리하였습니다!`;
                this.elements.gameOverSkillInfo.textContent = `결정타: "${lastPlayerSkill ? lastPlayerSkill.name : '알 수 없음'}"`;
            } else { 
                this.elements.gameOverTitle.textContent = "패배...";
                this.elements.gameOverTitle.className = "text-2xl sm:text-3xl font-bold mb-3 text-red-400";
                this.elements.gameOverMessage.textContent = `${winner.name}에게 패배하였습니다.`;
                this.elements.gameOverSkillInfo.textContent = `결정타: "${lastOpponentSkill ? lastOpponentSkill.name : '알 수 없음'}" (상대 스킬)`;
            }
            this.logToBattleLog(`${winner.name} 승리!`, "system");
        } else { 
             let winnerByHp = null;
             if (GameController.player.hp > GameController.opponent.hp) winnerByHp = GameController.player;
             else if (GameController.opponent.hp > GameController.player.hp) winnerByHp = GameController.opponent;

             if (winnerByHp) {
                this.elements.gameOverTitle.textContent = winnerByHp === GameController.player ? "판정승!" : "판정패";
                this.elements.gameOverTitle.className = `text-2xl sm:text-3xl font-bold mb-3 ${winnerByHp === GameController.player ? 'text-green-400' : 'text-red-400'}`;
                this.elements.gameOverMessage.textContent = `모든 라운드 종료. HP가 더 높은 ${winnerByHp.name}의 승리!`;
                this.elements.gameOverSkillInfo.textContent = `최종 HP: ${GameController.player.name} ${GameController.player.hp} vs ${GameController.opponent.name} ${GameController.opponent.hp}`;
                this.logToBattleLog(`게임 종료! ${winnerByHp.name} 판정승!`, "system");
             } else {
                this.elements.gameOverTitle.textContent = "무승부!";
                this.elements.gameOverTitle.className = "text-2xl sm:text-3xl font-bold mb-3 text-yellow-400";
                this.elements.gameOverMessage.textContent = "모든 라운드 종료. 두 플레이어의 HP가 같습니다!";
                this.elements.gameOverSkillInfo.textContent = `최종 HP: ${GameController.player.name} ${GameController.player.hp} vs ${GameController.opponent.name} ${GameController.opponent.hp}`;
                this.logToBattleLog("게임 종료! 무승부!", "system");
             }
        }
    },
    hideGameOverModal() {
        this.elements.gameOverModal.classList.add('hidden');
        this.elements.gameOverModal.classList.remove('flex');
    },

    updateSkillSetPreview(skillSets, activeSlotIndex = null) {
        const container = document.getElementById('skillSetSlotsContainer');
        if (!container) return;

        container.innerHTML = '';
        const safeSkillSets = Array.isArray(skillSets) ? skillSets : Array(GameConfig.MAX_SKILL_SETS).fill(null);
        
        safeSkillSets.forEach((skillSet, index) => {
            const slotElement = document.createElement('div');
            let slotClass = 'bg-gray-600 p-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-500 transition-all mb-2';
            if (activeSlotIndex === index) {
                slotClass += ' border-4 border-indigo-400 ring-2 ring-indigo-300';
            }
            slotElement.className = slotClass;
            
            if (skillSet && Array.isArray(skillSet.skills)) {
                slotElement.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-sm font-semibold text-indigo-300">${skillSet.name || `세팅 ${index + 1}`}</h3>
                        <div class="flex space-x-2">
                            <button class="edit-skill-set bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-2 py-1 rounded" data-index="${index}">수정</button>
                            <button class="delete-skill-set bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded" data-index="${index}">삭제</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-1">
                        ${skillSet.skills.map(skillKey => {
                            const skillName = skillKey && GameData.allSkills[skillKey] ? GameData.allSkills[skillKey].name : '-';
                            return `<div class="bg-gray-700 p-1 rounded text-xs text-center">${skillName}</div>`;
                        }).join('')}
                    </div>
                `;

                // 수정 버튼 이벤트
                slotElement.querySelector('.edit-skill-set')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    GameController.editSkillSet(index);
                });

                // 삭제 버튼 이벤트
                slotElement.querySelector('.delete-skill-set')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    GameController.deleteSkillSet(index);
                });

                // 전체 슬롯 클릭 이벤트 (활성화 및 시작 버튼 활성화)
                slotElement.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        GameController.activeSkillSetIndex = index; // 명시적으로 갱신
                        GameController.activateSkillSet(index, true); // 선택/활성화만!
                        // 매칭 시작 버튼 활성화
                        if (UIManager.elements.startMatchButton) {
                            UIManager.elements.startMatchButton.disabled = false;
                            UIManager.elements.startMatchButton.classList.remove('disabled-button', 'bg-gray-400');
                            UIManager.elements.startMatchButton.classList.add('bg-red-600', 'hover:bg-red-700');
                        }
                        // 레이아웃 유지를 위해 updateSkillSetPreview를 다시 호출
                        UIManager.updateSkillSetPreview(skillSets, index);
                    }
                });
            } else {
                slotElement.innerHTML = `
                    <div class="text-center">
                        <h3 class="text-sm font-semibold text-gray-400 mb-2">빈 슬롯 ${index + 1}</h3>
                        <p class="text-xs text-gray-500">클릭하여 새 세팅 만들기</p>
                    </div>
                `;
                slotElement.addEventListener('click', () => {
                    GameController.handleEmptySlotClick(index);
                });
            }
            container.appendChild(slotElement);
        });
        if (UIManager.elements.startMatchButton) {
            const hasActive = typeof activeSlotIndex === 'number' && safeSkillSets[activeSlotIndex];
            if (!hasActive) {
                UIManager.elements.startMatchButton.disabled = true;
                UIManager.elements.startMatchButton.classList.add('disabled-button', 'bg-gray-400');
                UIManager.elements.startMatchButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            }
        }
    },

    async activateSkillSet(slotIndex, showLog = true) {
        console.log('[activateSkillSet] 호출됨, slotIndex:', slotIndex);
        // ... 이하 생략
    },

    async startMatch() {
        console.log('[startMatch] 호출됨, activeSkillSetIndex:', this.activeSkillSetIndex, 'player:', this.player);
        await this.activateSkillSet(this.activeSkillSetIndex, false);

        // 임시로 조건문 주석 처리
        // if (!this.player || !this.player.selectedSkills.some(s => s !== null)) {
        //     UIManager.logToBattleLog("활성화된 세팅에 스킬이 없습니다.", "system");
        //     return;
        // }
        console.log('[startMatch] BattleController.initializeBattle() 호출');
        BattleController.initializeBattle();
    },

    updateBattleSkills() {
        // 플레이어 스킬 업데이트
        if (this.elements.playerBattleSkills && GameController.player) {
            GameController.player.selectedSkills.forEach((skill, index) => {
                const skillElement = this.elements.playerBattleSkills[index];
                if (!skillElement) return;

                if (skill && skill.skillKey) { // skill.skillKey가 있는지 확인
                    const skillData = GameData.allSkills[skill.skillKey];
                    if (skillData) {
                        skillElement.innerHTML = `
                            <div class="text-xs font-semibold text-white">${skillData.name}</div>
                         `;
                        skillElement.classList.remove('bg-gray-600');
                        skillElement.classList.add('bg-gray-500');
                    } else { // skillKey는 있지만 GameData에 없는 경우
                        skillElement.innerHTML = `
                            <div class="text-xs font-semibold text-gray-400">알 수 없음</div>
                         `;
                         skillElement.classList.remove('bg-gray-600');
                         skillElement.classList.add('bg-gray-500');
                         console.warn(`GameData에 없는 스킬 키: ${skill.skillKey}`);
                    }
                } else { // skill 객체가 없거나 skillKey가 없는 경우
                    skillElement.innerHTML = `
                        <div class="text-xs font-semibold text-white">스킬 ${index + 1}</div>
                     `;
                    skillElement.classList.remove('bg-gray-500');
                    skillElement.classList.add('bg-gray-600');
                }
            });
        }

        // 상대방 스킬 업데이트
        if (this.elements.opponentBattleSkills && GameController.opponent) {
            console.log('상대방 스킬 업데이트 시작', GameController.opponent.selectedSkills);
            GameController.opponent.selectedSkills.forEach((skillData, index) => { // skillData 객체로 받음
                const skillElement = this.elements.opponentBattleSkills[index];
                if (!skillElement) return;

                if (skillData && skillData.skillKey) { // skillData.skillKey가 있는지 확인
                     const skill = GameData.allSkills[skillData.skillKey]; // skill 객체 가져옴
                    if (skill) {
                        skillElement.innerHTML = `
                            <div class="text-xs font-semibold text-white">${skill.name}</div>
                         `;
                        skillElement.classList.remove('bg-gray-600');
                        skillElement.classList.add('bg-gray-500');
                    } else { // skillKey는 있지만 GameData에 없는 경우
                         skillElement.innerHTML = `
                            <div class="text-xs font-semibold text-gray-400">알 수 없음</div>
                         `;
                         skillElement.classList.remove('bg-gray-600');
                         skillElement.classList.add('bg-gray-500');
                         console.warn(`GameData에 없는 상대방 스킬 키: ${skillData.skillKey}`);
                    }
                } else { // skillData 객체가 없거나 skillData.skillKey가 없는 경우
                    skillElement.innerHTML = `
                        <div class="text-xs font-semibold text-white">스킬 ${index + 1}</div>
                     `;
                    skillElement.classList.remove('bg-gray-500');
                    skillElement.classList.add('bg-gray-600');
                }
            });
             console.log('상대방 스킬 업데이트 완료');
        }
    },

    highlightCurrentSkills(playerSkillIndex, opponentSkillIndex) {
        // 플레이어 스킬 하이라이트
        if (this.elements.playerBattleSkills) {
            this.elements.playerBattleSkills.forEach((skillElement, i) => {
                if (i === playerSkillIndex) {
                    skillElement.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-400', 'animate-pulse');
                } else {
                    skillElement.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-400', 'animate-pulse');
                }
            });
        }

        // 상대방 스킬 하이라이트
        if (this.elements.opponentBattleSkills) {
            this.elements.opponentBattleSkills.forEach((skillElement, i) => {
                if (i === opponentSkillIndex) {
                    skillElement.classList.add('ring-2', 'ring-offset-2', 'ring-teal-400', 'animate-pulse');
                } else {
                    skillElement.classList.remove('ring-2', 'ring-offset-2', 'ring-teal-400', 'animate-pulse');
                }
            });
        }
    },
};
