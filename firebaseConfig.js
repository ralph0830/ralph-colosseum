// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBmWInjWhLVEsju3XfYtgOH9_j3wQWv5b8",
    authDomain: "ralph-colosseum.firebaseapp.com",
    databaseURL: "https://ralph-colosseum-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ralph-colosseum",
    storageBucket: "ralph-colosseum.firebasestorage.app",
    messagingSenderId: "822435532798",
    appId: "1:822435532798:web:e2694086cc80c9bb007aaf"
};

// Firebase 초기화 함수
async function initializeFirebase() {
    try {
        // Firebase SDK가 로드되었는지 확인
        if (typeof firebase !== 'undefined' && 
            typeof firebase.initializeApp === 'function' && 
            typeof firebase.auth === 'function' && 
            typeof firebase.firestore === 'function') {
            
            // FirebaseService가 정의되어 있는지 확인
            if (window.FirebaseService && typeof window.FirebaseService.initializeFirebase === 'function') {
                await window.FirebaseService.initializeFirebase();
                console.log('Firebase 초기화 완료');
            } else {
                console.error('FirebaseService가 정의되지 않았습니다.');
                const authMessage = document.getElementById('authMessage');
                if (authMessage) {
                    authMessage.textContent = 'FirebaseService가 정의되지 않았습니다. 잠시 후 다시 시도해주세요.';
                    authMessage.classList.add('text-red-400');
                }
                // FirebaseService가 없으면 0.5초 후 다시 시도
                setTimeout(() => {
                    window.dispatchEvent(new Event('DOMContentLoaded'));
                }, 500);
            }
        } else {
            console.error('Firebase SDK가 로드되지 않았습니다.');
            const authMessage = document.getElementById('authMessage');
            if (authMessage) {
                authMessage.textContent = 'Firebase SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.';
                authMessage.classList.add('text-red-400');
            }
        }
    } catch (error) {
        console.error('Firebase 초기화 중 오류:', error);
    }
}

// DOMContentLoaded 이벤트 리스너 등록
window.addEventListener('DOMContentLoaded', initializeFirebase);
