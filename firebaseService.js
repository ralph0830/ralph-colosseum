// --- 모듈: Firebase 서비스 ---
const FirebaseService = {
    app: null,
    auth: null,
    db: null,

    initializeFirebase() {
        // Firebase 앱이 이미 초기화되었는지 확인
        if (!firebase.apps.length) {
            try {
                this.app = firebase.initializeApp(firebaseConfig); // gameConfig.js에 정의된 설정 사용
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                console.log("Firebase initialized successfully!");
            } catch (error) {
                console.error("Firebase initialization error:", error);
                if (typeof UIManager !== 'undefined' && UIManager.elements && UIManager.elements.authMessage) {
                    UIManager.elements.authMessage.textContent = "Firebase 초기화 실패. 콘솔을 확인하세요.";
                }
            }
        } else {
            this.app = firebase.app(); // 이미 초기화된 앱 가져오기
            this.auth = firebase.auth();
            this.db = firebase.firestore();
        }
    },

    async saveUserData(userId, data) {
        if (!this.db || !userId) {
            console.error("Firestore not initialized or userId missing for saveUserData");
            return;
        }
        try {
            await this.db.collection('users').doc(userId).set(data, { merge: true });
            console.log("User data saved for user:", userId);
        } catch (error) {
            console.error("Error saving user data:", error);
        }
    },

    async loadUserData(userId) {
        if (!this.db || !userId) {
            console.error("Firestore not initialized or userId missing for loadUserData");
            return null;
        }
        try {
            const docRef = this.db.collection('users').doc(userId);
            const doc = await docRef.get();
            if (doc.exists) {
                console.log("User data loaded for user:", userId, doc.data());
                return doc.data();
            } else {
                console.log("No such document for user:", userId);
                return null;
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            return null;
        }
    },

    async saveSkillSetting(userId, slotIndex, skillSetData) {
        if (!this.db || !userId) {
            console.error("Firestore not initialized or userId missing for saveSkillSetting");
            return false;
        }
        try {
            const docId = `set_${slotIndex}`;
            await this.db.collection('users').doc(userId).collection('skillSettings').doc(docId).set(skillSetData);
            console.log(`Skill setting saved to slot ${slotIndex} (docId: ${docId}) for user ${userId}`);
            return true;
        } catch (error) {
            console.error(`Error saving skill setting to slot ${slotIndex}:`, error);
            return false;
        }
    },

    async loadAllSkillSettings(userId) {
        if (!this.db || !userId) {
            console.error("Firestore not initialized or userId missing for loadAllSkillSettings");
            return Array(GameConfig.MAX_SKILL_SETS).fill(null); 
        }
        try {
            const skillSets = Array(GameConfig.MAX_SKILL_SETS).fill(null); // 슬롯 개수만큼 null로 초기화
            const snapshot = await this.db.collection('users').doc(userId).collection('skillSettings').get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const docId = doc.id; 
                // 문서 ID (예: "set_0")에서 숫자 인덱스 추출
                const slotIndexMatch = docId.match(/^set_(\d+)$/);
                if (slotIndexMatch && slotIndexMatch[1]) {
                    const slotIndex = parseInt(slotIndexMatch[1]);
                    if (slotIndex >= 0 && slotIndex < GameConfig.MAX_SKILL_SETS) {
                        skillSets[slotIndex] = { id: docId, slotIndex: slotIndex, ...data };
                    }
                }
            });
            console.log(`Loaded ${skillSets.filter(s => s !== null).length} skill sets for user ${userId}`);
            return skillSets;
        } catch (error) {
            console.error("Error loading skill settings:", error);
            return Array(GameConfig.MAX_SKILL_SETS).fill(null);
        }
    },

    async deleteSkillSetting(userId, slotIndex) { 
        if (!this.db || !userId) {
            console.error("Firestore not initialized or userId missing for deleteSkillSetting");
            return false;
        }
        try {
            const docId = `set_${slotIndex}`;
            await this.db.collection('users').doc(userId).collection('skillSettings').doc(docId).delete();
            console.log(`Skill setting in slot ${slotIndex} (docId: ${docId}) deleted for user ${userId}`);
            return true;
        } catch (error) {
            console.error(`Error deleting skill setting in slot ${slotIndex}:`, error);
            return false;
        }
    }
};
