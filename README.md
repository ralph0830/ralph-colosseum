# Ralph's Colosseum

턴제 전투 RPG 게임입니다. 다양한 직업과 스킬을 선택하여 AI와 대전할 수 있습니다.

## 주요 기능

- 3가지 직업 (전사, 마법사, 도적)
- 각 직업별 고유 스킬 시스템
- 스킬 세팅 저장 및 관리
- AI와의 대전 시스템
- Firebase를 이용한 사용자 인증

## 기술 스택

- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Backend: Firebase (Authentication, Firestore)
- 반응형 디자인 지원

## 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/[your-username]/ralph-colosseum.git
cd ralph-colosseum
```

2. Firebase 설정
- Firebase 콘솔에서 새 프로젝트 생성
- 웹 앱 추가
- `gameConfig.js`의 Firebase 설정 업데이트

3. 웹 서버 실행
- 로컬 웹 서버를 사용하여 실행 (예: Live Server)

## 게임 규칙

- 각 플레이어는 6개의 스킬을 선택할 수 있습니다.
- 스킬 사용에는 Upkeep이 필요합니다 (최대 100).
- 18턴 동안 전투가 진행됩니다.
- HP가 0이 되거나 18턴이 지나면 게임이 종료됩니다.

## 프로젝트 구조

```
ralph-colosseum/
├── index.html          # 메인 HTML 파일
├── style.css          # 스타일시트
├── gameConfig.js      # 게임 설정
├── gameData.js        # 게임 데이터
├── skillSystem.js     # 스킬 시스템
├── battleSystem.js    # 전투 시스템
├── player.js          # 플레이어 관련 로직
├── uiManager.js       # UI 관리
├── battleController.js # 전투 컨트롤러
├── gameController.js  # 게임 컨트롤러
├── eventHandler.js    # 이벤트 핸들러
├── firebaseService.js # Firebase 서비스
├── authManager.js     # 인증 관리
└── main.js           # 메인 진입점
```

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요. 