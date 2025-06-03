// --- 모듈: 인증 관리 ---
const AuthManager = {
    initialize() {
        FirebaseService.initializeFirebase(); // Firebase 서비스 초기화 보장
    },

    // 로그인 상태 변경 감지
    checkAuthState() {
        if (!FirebaseService.auth) {
            console.error("Firebase Auth is not initialized.");
            if (typeof UIManager !== 'undefined' && UIManager.elements && UIManager.elements.authMessage) {
                UIManager.elements.authMessage.textContent = "인증 시스템 초기화 실패. 잠시 후 다시 시도해주세요.";
            }
            return;
        }
        FirebaseService.auth.onAuthStateChanged(user => {
            GameController.updateUIBasedOnAuthState(user); // GameController에 상태 전달
            if (user) {
                console.log("User is signed in:", user.uid, user.email);
            } else {
                console.log("User is signed out.");
            }
        });
    },

    // 회원가입
    async signup() {
        if (!FirebaseService.auth) {
            UIManager.elements.authMessage.textContent = "인증 시스템 오류입니다.";
            return;
        }
        const email = UIManager.elements.emailInput.value;
        const password = UIManager.elements.passwordInput.value;
        UIManager.elements.authMessage.textContent = ""; 

        try {
            const userCredential = await FirebaseService.auth.createUserWithEmailAndPassword(email, password);
            console.log("Signup successful:", userCredential.user);
            UIManager.elements.authMessage.textContent = "회원가입 성공! 자동으로 로그인됩니다.";
            // 새 사용자 데이터 Firestore에 저장 (기본 정보)
            await FirebaseService.saveUserData(userCredential.user.uid, { 
                email: userCredential.user.email, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp(), // 서버 타임스탬프 사용
                displayName: userCredential.user.email.split('@')[0] // 기본 displayName
            });
        } catch (error) {
            console.error("Signup error:", error);
            UIManager.elements.authMessage.textContent = `회원가입 실패: ${this.formatAuthError(error.message)}`;
        }
    },

    // 로그인
    async login() {
        if (!FirebaseService.auth) {
            UIManager.elements.authMessage.textContent = "인증 시스템 오류입니다.";
            return;
        }
        const email = UIManager.elements.emailInput.value;
        const password = UIManager.elements.passwordInput.value;
        UIManager.elements.authMessage.textContent = "";

        try {
            const userCredential = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
            console.log("Login successful:", userCredential.user);
            UIManager.elements.authMessage.textContent = "로그인 성공!";
        } catch (error) {
            console.error("Login error:", error);
            UIManager.elements.authMessage.textContent = `로그인 실패: ${this.formatAuthError(error.message)}`;
        }
    },

    // 로그아웃
    async logout() {
        if (!FirebaseService.auth) return;
        try {
            await FirebaseService.auth.signOut();
            console.log("Logout successful");
            // UI 업데이트는 onAuthStateChanged에서 처리됨
        } catch (error) {
            console.error("Logout error:", error);
            UIManager.elements.authMessage.textContent = `로그아웃 실패: ${error.message}`;
        }
    },

    // Firebase 인증 오류 메시지 가공
    formatAuthError(errorMessage) {
        if (errorMessage.includes("auth/invalid-email")) {
            return "유효하지 않은 이메일 주소입니다.";
        } else if (errorMessage.includes("auth/user-not-found")) {
            return "등록되지 않은 사용자입니다.";
        } else if (errorMessage.includes("auth/wrong-password")) {
            return "비밀번호가 일치하지 않습니다.";
        } else if (errorMessage.includes("auth/email-already-in-use")) {
            return "이미 사용 중인 이메일 주소입니다.";
        } else if (errorMessage.includes("auth/weak-password")) {
            return "비밀번호는 6자리 이상이어야 합니다.";
        } else if (errorMessage.includes("auth/operation-not-allowed")) {
            return "이메일/비밀번호 로그인이 활성화되지 않았습니다. (Firebase 콘솔 확인)";
        }
        return "인증 오류가 발생했습니다. 다시 시도해주세요.";
    }
};
