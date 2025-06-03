// --- 모듈: 게임 설정 ---
const GameConfig = {
    MAX_UPKEEP: 100, // 최대 Upkeep
    MAX_SKILL_SLOTS: 6, // 플레이어가 선택할 스킬 슬롯 수
    TOTAL_BATTLE_TURNS: 18, // 총 전투 턴 수 (6 skills * 3 rounds)
    AUTO_PROCEED_DELAY: 3000, // 자동 진행 딜레이 (ms)
    FAST_AUTO_PROCEED_DELAY: 1500, // 2배속 1.5초
    MAX_SKILL_SETS: 3, // 저장 가능한 스킬 세팅 개수
    
    IMAGE_PATH: {},
    SOUND_PATH: {}
};

// Firebase 설정 (!!! 중요: 실제 프로젝트의 설정으로 반드시 교체해야 합니다 !!!)
// Firebase 콘솔 (console.firebase.google.com)의 프로젝트 설정 > 일반 탭에서
// "내 앱" 섹션의 웹 앱 설정 값을 복사하여 아래에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyBmWInjWhLVEsju3XfYtgOH9_j3wQWv5b8",
  authDomain: "ralph-colosseum.firebaseapp.com",
  databaseURL: "https://ralph-colosseum-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ralph-colosseum",
  storageBucket: "ralph-colosseum.firebasestorage.app",
  messagingSenderId: "822435532798",
  appId: "1:822435532798:web:e2694086cc80c9bb007aaf"
};
