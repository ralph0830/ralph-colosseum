// --- main.js ---
// 이 파일은 모든 다른 JavaScript 모듈이 로드된 후 마지막에 실행되어야 합니다.
// 게임의 전체적인 초기화 및 시작을 담당합니다.

/**
 * Firebase SDK 및 GameController가 모두 로드될 때까지 기다린 후
 * GameController.initialize()를 호출하여 게임을 시작합니다.
 */
function initializeAppWhenFirebaseReady() {
    // firebase 객체와 주요 서비스(app, auth, firestore)가 사용 가능한지 확인
    if (typeof firebase !== 'undefined' && 
        typeof firebase.app === 'function' && 
        typeof firebase.auth === 'function' && 
        typeof firebase.firestore === 'function') {
        
        // GameController 객체가 정의되었는지, 그리고 initialize 메소드가 있는지 확인
        if (typeof GameController !== 'undefined' && typeof GameController.initialize === 'function') {
            // Firebase SDK 및 GameController가 로드되었으므로 게임 컨트롤러 초기화
            console.log("Firebase SDK and GameController loaded. Initializing game...");
            GameController.initialize();
        } else {
            // GameController가 아직 정의되지 않았으면 오류 로그를 남기고 잠시 후 다시 시도
            console.error("GameController is not defined or initialize method is missing. Waiting for gameController.js to load...");
            // 재시도 간격을 두어 무한 루프에 빠지지 않도록 주의 (또는 최대 재시도 횟수 설정)
            setTimeout(initializeAppWhenFirebaseReady, 200); // 0.2초 후 재시도
        }
    } else {
        // Firebase SDK가 아직 로드되지 않았으면 잠시 후 다시 시도
        console.log("Waiting for Firebase SDK to load...");
        setTimeout(initializeAppWhenFirebaseReady, 200); // 0.2초 후 재시도
    }
}

// window.onload는 DOM 및 모든 리소스(이미지, 스크립트 등) 로드가 완료된 후 발생합니다.
// Firebase SDK는 defer 속성으로 비동기 로드되므로, 로드 완료 시점을 명확히 확인하는 것이 중요합니다.
window.onload = () => {
    console.log("Window loaded. Starting app initialization check...");
    initializeAppWhenFirebaseReady();
};
