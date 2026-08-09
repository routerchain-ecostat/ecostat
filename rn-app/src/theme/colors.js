import { C, FAM } from "../data/data";

// C: 제도판(plotting paper) 팔레트 — 웹 버전과 동일
// FAM: 지표 계열(fam) 문자열 → 색상 매핑
export { C, FAM };

export const RADIUS = 2;

export const FONT = {
  // 프로젝트에 IBM Plex Sans KR / IBM Plex Mono를 추가하려면
  // expo-font로 assets/fonts/*.ttf를 로드하고 아래 이름을 그 폰트명으로 바꾸세요.
  sans: undefined, // 시스템 기본 산세리프
  mono: "monospace", // iOS는 Courier로 자동 대체됨 (아래 monoFont() 참고)
};

import { Platform } from "react-native";
export const monoFont = () => (Platform.OS === "ios" ? "Courier" : "monospace");
