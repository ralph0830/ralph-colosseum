// --- 모듈: 인증 관리 ---
const AuthManager = {
    initialize() {
        // Firebase 인증 상태 변경 리스너 설정
        FirebaseService.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log(`사용자 인증 상태 확인: ${user.email} (${user.uid})`);
                // 이전 세션에서 저장된 인증 정보가 있는 경우
                if (localStorage.getItem('lastLoginTime')) {
                    const lastLogin = new Date(localStorage.getItem('lastLoginTime'));
                    const now = new Date();
                    const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);
                    
                    if (hoursSinceLastLogin > 24) {
                        console.log('24시간이 지나 자동 로그아웃됩니다.');
                        this.logout();
                        return;
                    }
                }
                localStorage.setItem('lastLoginTime', new Date().toISOString());
                GameController.updateUIBasedOnAuthState(user);
            } else {
                console.log('사용자가 로그아웃되었거나 인증되지 않았습니다.');
                localStorage.removeItem('lastLoginTime');
                GameController.updateUIBasedOnAuthState(null);
            }
        });
    },

    async login(email, password) {
        try {
            const userCredential = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
            console.log(`로그인 성공: ${userCredential.user.email}`);
            localStorage.setItem('lastLoginTime', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('로그인 실패:', error);
            UIManager.elements.authMessage.textContent = this.getAuthErrorMessage(error.code);
            UIManager.elements.authMessage.classList.add('text-red-400');
            return false;
        }
    },

    async signup(email, password) {
        try {
            const userCredential = await FirebaseService.auth.createUserWithEmailAndPassword(email, password);
            console.log(`회원가입 성공: ${userCredential.user.email}`);
            localStorage.setItem('lastLoginTime', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('회원가입 실패:', error);
            UIManager.elements.authMessage.textContent = this.getAuthErrorMessage(error.code);
            UIManager.elements.authMessage.classList.add('text-red-400');
            return false;
        }
    },

    async logout() {
        try {
            await FirebaseService.auth.signOut();
            console.log('로그아웃 성공');
            localStorage.removeItem('lastLoginTime');
            UIManager.elements.emailInput.value = '';
            UIManager.elements.passwordInput.value = '';
            UIManager.elements.authMessage.textContent = '';
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    },

    async checkAuthState() {
        return new Promise((resolve) => {
            FirebaseService.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    console.log(`사용자 인증 상태 확인: ${user.email} (${user.uid})`);
                    // 이전 세션에서 저장된 인증 정보가 있는 경우
                    if (localStorage.getItem('lastLoginTime')) {
                        const lastLogin = new Date(localStorage.getItem('lastLoginTime'));
                        const now = new Date();
                        const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);
                        
                        if (hoursSinceLastLogin > 24) {
                            console.log('24시간이 지나 자동 로그아웃됩니다.');
                            this.logout();
                            return;
                        }
                    }
                    localStorage.setItem('lastLoginTime', new Date().toISOString());
                    GameController.updateUIBasedOnAuthState(user);
                    resolve(true);
                } else {
                    console.log('사용자가 로그아웃되었거나 인증되지 않았습니다.');
                    localStorage.removeItem('lastLoginTime');
                    GameController.updateUIBasedOnAuthState(null);
                    resolve(false);
                }
            });
        });
    },

    getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return '이메일 또는 비밀번호가 올바르지 않습니다.';
            case 'auth/email-already-in-use':
                return '이미 사용 중인 이메일입니다.';
            case 'auth/weak-password':
                return '비밀번호가 너무 약합니다.';
            case 'auth/invalid-email':
                return '유효하지 않은 이메일 형식입니다.';
            case 'auth/too-many-requests':
                return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            default:
                return '인증 중 오류가 발생했습니다.';
        }
    }
};
