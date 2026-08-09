// Google Cloud Console(console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보에서
// "OAuth 클라이언트 ID"를 3가지 유형으로 만들어 아래에 채워 넣으세요.
// 하나만 있어도 동작하지만, 실제 배포 시에는 플랫폼별로 따로 만드는 것이 정석입니다.
//
//   iosClientId     : "iOS" 유형, 번들 ID = kr.macro.console (app.json의 ios.bundleIdentifier)
//   androidClientId : "Android" 유형, 패키지명 = kr.macro.console, SHA-1 지문 등록 필요
//   webClientId     : "웹 애플리케이션" 유형 — Expo Go(개발 중) 및 웹 실행 시 사용
//
// 값을 채우지 않으면 로그인 화면에서 "Google로 계속하기"를 눌렀을 때 안내 메시지가 뜨고,
// 게스트로 계속하기는 항상 정상 동작합니다.

export const GOOGLE_OAUTH = {
  iosClientId: "",
  androidClientId: "",
  webClientId: "",
};

export const isGoogleConfigured = () =>
  !!(GOOGLE_OAUTH.iosClientId || GOOGLE_OAUTH.androidClientId || GOOGLE_OAUTH.webClientId);
