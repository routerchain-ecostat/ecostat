# 거시 관제탑 — React Native (Expo)

미국·한국·일본·유로존·중국 5개국, 101개 거시경제 지표, 2016~2026년 11개년 데이터를
담은 React Native 앱입니다. 웹/HTML 버전과 동일한 데이터셋을 그대로 재사용합니다.

## 이 환경에서 못 한 것

이 프로젝트는 네트워크가 차단된 환경에서 작성돼 **`npm install`도 `expo start`도
실행해 실제로 구동해보지 못했습니다.** 대신 다음을 정적으로 전부 검증했습니다.

- 모든 `.js` 파일의 중괄호·소괄호·대괄호 균형
- 모든 `import`가 대상 파일의 실제 `export`와 일치하는지 (자동 스크립트로 전수 대조)
- `useApp()`으로 꺼내 쓰는 모든 항목이 `AppContext`가 실제로 제공하는지
- 101개 지표 전부 `series`(월별), `yr`(11개년), `sched`(발표일정), `what/imp/why/watch/url`
  필드가 RN 컴포넌트가 기대하는 형식과 정확히 일치하는지

문법적으로는 깨끗하지만, **실기기/시뮬레이터에서 아직 실행해본 적은 없습니다.**
처음 실행하면 RN 버전 특유의 사소한 이슈(패키지 버전 조합, 아이콘 폰트 등)가 나올 수 있습니다.

## 문제 해결 기록

**"Expo Go에서 앱이 아예 실행이 안 된다"** — 처음 인앱결제(`react-native-iap`)를
추가했을 때 실제로 발생했던 문제입니다. 원인과 조치를 남겨둡니다.

- **원인**: `SubscriptionContext.js` 맨 위에 `import * as RNIap from "react-native-iap"`
  처럼 정적으로 불러오고 있었습니다. 이 구문은 파일이 평가되는 순간 무조건 실행되는데,
  `react-native-iap`는 네이티브 모듈이라 Expo Go 안에는 아예 존재하지 않습니다. 그
  결과 앱이 화면을 그리기도 전에 예외가 발생했고, 이 시점의 오류는 try/catch로 감쌀
  방법이 없어 앱 전체가 죽었습니다.
- **조치**: `src/api/iapSafe.js`를 새로 만들어, `react-native-iap`를 함수 안에서
  `require()`로(정적 `import`가 아니라) 불러오고 그 호출 자체를 try/catch로 감쌌습니다.
  또 `src/utils/env.js`로 지금이 Expo Go인지 미리 감지해, Expo Go에서는 아예 시도조차
  하지 않습니다. `SubscriptionContext.js`는 이제 `react-native-iap`를 직접 참조하지
  않고 이 안전한 래퍼만 거칩니다.
- **지금 상태**: Expo Go에서 실행하면 결제 관련 함수는 전부 조용히 비활성화되고,
  나머지 기능(30일 무료 체험, 지표·원자재·발표일·상관관계·설정 탭)은 정상 동작합니다.

## 실행 방법

```bash
cd macro-console-rn
npm install
npx expo start
```

- **Expo Go 앱**(iOS/Android 스토어에서 무료)으로 QR코드를 스캔하면 바로 실행됩니다.
- 시뮬레이터로 보려면 터미널에서 `i`(iOS) 또는 `a`(Android)를 누르세요.
- 실제 기기에 설치 가능한 빌드가 필요하면 `npx eas build`(Expo 계정 필요)를 쓰세요.

## 원자재 탭

하단 탭바에 **원자재**가 있습니다. 지표 탭과 완전히 분리된 별도 화면입니다.

- **26개 원자재** · 5개 카테고리(에너지·귀금속·산업금속·농산물·축산물)
  - 에너지(6): WTI 원유, 브렌트유, 천연가스(헨리허브), 가솔린 RBOB, Dutch TTF 천연가스, 런던 가스오일
  - 귀금속(4): 금, 은, 백금, 팔라듐
  - 산업금속(5): 구리, 알루미늄, 아연, 니켈, 납
  - 농산물(9): 옥수수, 밀, 대두, 커피 C, 설탕 No.11, 원면 No.2, 런던 코코아, 미국 코코아, 현미
  - 축산물(2): 생우, 돈육
- 각 원자재 카드는 지표 카드와 같은 깊이입니다 — 정의·중요성, "왜 이런 가격이 나왔나" 4단
  분석, 확인 포인트, 11개년(2016~2026) 궤적과 연도별 해설, **출처**
- 카테고리 필터 칩 + 연도 드롭다운(지표 탭과 동일한 패턴)
- **자동 실시간 시세** — Stooq에서 원자재 선물/현물 가격을 5분마다 자동으로 불러옵니다. 설정 탭
  "시세 심볼 (원자재)"에서 심볼을 개별 수정할 수 있습니다 (선물은 계약월이 바뀌면
  심볼도 바뀌므로 주기적으로 확인이 필요합니다)

`src/data/commodities.js`에 전체 데이터가 있고, `CommoditiesContext`가 지표 탭의
`AppContext`와 같은 패턴(연도/필터/수정값/자동 갱신)으로 독립적으로 상태를 관리합니다.

## 출처 표시

지표 카드와 원자재 카드 모두 하단에 **"출처 · ○○○"** 줄이 있습니다. 각 지표/원자재
데이터에 있는 상세 출처(`src` 필드, 예: "CME Group · WTI 원유 선물(CL)")를 우선 표시하고,
그 필드가 없는 항목은 발표 기관명(`org`)으로 대체합니다. 그 옆 **"원문 ↗"** 버튼을 누르면
해당 공식 발표처 페이지가 바로 열립니다.

## 소셜 로그인

앱 실행 시 로그인 화면이 먼저 뜹니다. 세 가지 방법이 있습니다.

- **게스트로 계속하기** — 설정 없이 바로 됩니다. 모든 기능을 동일하게 쓸 수 있고, 로그인
  정보만 없을 뿐입니다.
- **Apple로 계속하기** — iOS 기기/시뮬레이터에서만 보입니다. 실제 배포용으로 쓰려면
  Apple Developer 계정(유료)에서 "Sign in with Apple" 기능을 활성화해야 합니다.
- **Google로 계속하기** — 아래 설정을 먼저 해야 동작합니다. 설정 전에는 눌러도 안내
  메시지만 뜨고 로그인은 되지 않습니다.

### Google 로그인 설정하기

1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 생성 →
   "API 및 서비스 → 사용자 인증 정보"로 이동
2. "OAuth 클라이언트 ID" 만들기를 유형별로 진행:
   - **iOS**: 번들 ID에 `kr.macro.console` 입력 (app.json과 동일해야 함)
   - **Android**: 패키지명 `kr.macro.console` + SHA-1 지문 등록 (`eas credentials`로 확인 가능)
   - **웹 애플리케이션**: Expo Go로 개발 중 테스트할 때 사용
3. 발급받은 세 개(또는 필요한 것만)의 클라이언트 ID를 `src/config/auth.js`에 붙여넣기
4. 다시 `npx expo start` — 이제 Google 버튼이 실제로 동작합니다

로그인 세션은 `AsyncStorage`에 저장되어 앱을 껐다 켜도 유지됩니다. 로그아웃은
설정 탭 맨 위 "계정" 섹션에서 할 수 있습니다.

**이 환경에서 확인 못 한 것**: 네트워크가 차단돼 있어 Google/Apple 로그인 흐름을
실제로 실행해보지 못했습니다. 코드는 `expo-auth-session` / `expo-apple-authentication`
공식 문서의 표준 패턴을 그대로 따랐지만, 처음 연결할 때 리디렉션 URI나 SHA-1 지문
설정에서 막히면 각 서비스의 콘솔 오류 메시지를 확인해 주세요.

## 자동 실시간 갱신 (버튼 없음)

이전 버전에는 카드마다 "실시간 시세" 버튼이 있었습니다. 지금은 **버튼이 없습니다.**
화면을 열면 자동으로 갱신되고, 그 뒤로도 주기적으로 스스로 갱신됩니다.

| 대상 | 방식 | 주기 |
|---|---|---|
| 지수·채권 10종, 원자재 10종 | Stooq 무료 시세 (네이티브라 프록시 불필요) | 5분마다 자동 |
| 나머지 거시지표(CPI·GDP 등) 약 80종 | Claude API + 웹 검색으로 공식 발표처 확인 | 30분마다 자동 |

두 경우 모두 **화면 진입 즉시 1회 실행되고**, 그 뒤 백그라운드에서 반복됩니다.
지표 탭·원자재 탭 상단을 **아래로 당기면(pull-to-refresh)** 주기를 기다리지 않고
바로 다시 불러옵니다. 값이 자동으로 갱신된 지표에는 `LIVE` 배지가 붙습니다.

### 거시지표(CPI·GDP 등) 자동 갱신의 한계 — 꼭 읽어주세요

지수·채권·원자재는 Stooq라는 공개 무료 API가 있어 완전히 동작합니다. 그런데
CPI·실업률 같은 나머지 80여 개 지표는 이런 무료 실시간 API가 존재하지 않습니다.
그래서 `src/api/aiRefresh.js`는 **Claude API(`api.anthropic.com`)를 인증 없이
직접 호출**하는 방식으로 구현했습니다.

- **Claude.ai 아티팩트 환경 안에서는** 이 호출이 그대로 동작합니다(이 프로젝트가
  거기서 만들어졌기 때문에 원래 웹 버전의 "지표 갱신" 기능이 이 방식이었습니다).
- **앱스토어에 배포하는 독립 실행 앱에서는 이 호출이 실패합니다.** API 키가
  없기 때문입니다. 실패해도 앱이 멈추지 않고 조용히 시드 데이터를 유지하며,
  설정 탭에 "자동 갱신 연결 실패" 정도의 안내만 나타납니다.
- **실제 서비스로 배포하려면** 자체 백엔드(예: Cloudflare Worker, AWS Lambda
  같은 서버리스 함수)를 하나 두고 거기서 Anthropic API 키를 안전하게 보관한 뒤,
  `src/api/aiRefresh.js`의 `BACKEND_URL`만 그 백엔드 주소로 바꾸면 됩니다.
  이 코드는 그 스위치 하나로 그대로 이어붙게 설계했습니다.

이 환경은 네트워크가 차단돼 있어 두 자동 갱신 경로 모두 실제로 실행해보지
못했습니다. Stooq 쪽은 심볼 표기(`SYM_DEF`)가 실제와 다를 수 있고,
`aiRefresh.js` 쪽은 위에서 설명한 대로 백엔드 없이는 프로덕션에서 동작하지
않는다는 점을 감안해 주세요.

## 인앱결제 (구독)

Google Play·App Store 양쪽 결제를 `react-native-iap`로 구현했습니다.

| 상품 | 가격 | 상품 ID |
|---|---|---|
| 월간 구독 | ₩3,000 / 월 | `monthly_premium` |
| 연간 구독 | ₩20,000 / 년 (월간 대비 약 44% 절약) | `yearly_premium` |

### 잠금 방식 — 30일 무료 체험 후 전체 잠금

- **가입(최초 실행) 시점부터 30일간** 모든 기능을 제한 없이 씁니다 (5개국 전체 지표,
  26개 원자재, 자동 실시간 갱신 전부 포함).
- **30일이 지나면** 구독하지 않는 한 앱 전체가 잠깁니다. 탭이나 화면이 부분적으로
  막히는 게 아니라, 앱을 열면 **구독 화면이 전체 화면으로 뜨고 다른 곳으로 이동할 수
  없습니다.** 유일한 선택지는 구독하거나, 구매 복원을 시도하거나, 로그아웃하는 것뿐입니다.
- **구독하면 즉시** 잠금이 풀리고 원래 화면(지표 탭)으로 자동 전환됩니다. 버튼을 다시
  누르거나 새로고침할 필요가 없습니다 — 결제가 확인되는 순간 상태가 바뀝니다.

이 로직은 `src/context/SubscriptionContext.js`의 `hasAccess` 값
(`isSubscribed || trialActive`) 하나로 결정되고, `App.js`의 `AccessGate` 컴포넌트가
`hasAccess`가 거짓이면 앱 전체를 `SubscriptionScreen`(`blocking` 모드)으로 완전히
대체합니다.

**"30일"을 바꾸고 싶으면** `SubscriptionContext.js` 상단의 `TRIAL_DAYS` 상수 하나만
고치면 됩니다.

### 화면 구성

- **설정 탭 맨 위 "구독" 섹션** — 현재 상태(체험 중 D-n / 구독 중 / 체험 종료) 표시 +
  "구독하기"·"구독 관리" 버튼
- **체험 종료 시 뜨는 잠금 화면** — 위와 같은 `SubscriptionScreen` 컴포넌트를
  `blocking` 모드로 렌더링한 것. "닫기" 버튼이 없고, 맨 아래 로그아웃 링크만 있습니다.
- **구독 화면**(`SubscriptionScreen`) — 월간·연간 카드, 구매 버튼, **구매 복원** 버튼,
  자동갱신·해지 방법 안내, 약관·개인정보처리방침 링크(placeholder URL이니 실제 주소로 교체 필요)
- 나라 칩이나 원자재 잠금 카드를 누르면 자동으로 이 구독 화면이 모달로 뜹니다

### 스토어에 등록해야 하는 것

1. **App Store Connect**: 자동갱신 구독 그룹을 만들고 `monthly_premium`(₩3,000대 등급),
   `yearly_premium`(₩20,000대 등급) 두 개를 등록
2. **Google Play Console**: 구독 상품 하나에 기본 요금제 두 개(`monthly_premium`,
   `yearly_premium`)를 각각 월간/연간으로 등록, 가격을 3,000원/20,000원으로 설정
3. 두 스토어의 상품 ID는 반드시 `src/config/iap.js`의 `SKUS`와 정확히 일치해야 합니다

### ⚠️ 중요한 한계 — 꼭 읽어주세요

**이 구현은 서버가 없어 영수증을 검증하지 않습니다.** `SubscriptionContext`는 기기에
캐시된 "마지막으로 확인된 구매"만 보고 구독 여부를 판단합니다. 이것으로 충분한 것:

- 결제 흐름 자체(상품 조회 → 결제 → 완료 처리)
- 앱 재실행 시 `getAvailablePurchases()`로 자동 복원
- 사용자가 누른 "구매 복원" 버튼

이것으로 **부족한 것** (실제 서비스라면 반드시 필요):

- 구독이 **만료**됐는지 확인 (환불, 해지 후 기간 만료 등) — 클라이언트만으로는 알 수 없습니다
- 부정 사용(영수증 위조) 방지
- 여러 기기 간 실시간 동기화

프로덕션으로 가려면 App Store Server API(Apple) / Google Play Developer API(Google)로
서버에서 영수증·구독 상태를 검증하고, 그 결과를 앱에 내려주는 백엔드가 필요합니다.
지금 구조는 그 백엔드가 준비됐을 때 `SubscriptionContext.persistEntitlement()` 호출
지점에 서버 응답을 끼워 넣기만 하면 되도록 설계했습니다.

**이 환경은 네트워크가 차단돼 있어 실제 결제 흐름을 한 번도 실행해보지 못했습니다.**
`react-native-iap`는 네이티브 모듈이라 **Expo Go에서는 동작하지 않고**, `npx expo prebuild`
또는 EAS Build로 만든 개발 빌드(dev client)가 필요합니다. iOS 결제 테스트는 App Store

> **Expo Go에서 실행 시 자동으로 우회합니다.** `src/api/iapSafe.js`가 Expo Go
> 환경을 감지해 `react-native-iap`를 아예 불러오지 않으며, 결제 관련 함수는 전부
> 안전한 빈 동작(no-op)으로 대체됩니다. 그래서 Expo Go에서도 앱이 죽지 않고
> **30일 무료 체험과 나머지 모든 화면은 정상 동작**하고, 실제 결제 버튼을 누르면
> "Expo Go에서는 인앱결제를 사용할 수 없습니다" 안내만 뜹니다. 결제까지 실제로
> 테스트하려면 아래처럼 개발 빌드가 필요합니다.
Connect의 샌드박스 테스터 계정이, Android는 Play Console의 라이선스 테스터 등록이
있어야 실제 결제창이 뜹니다.

### 개발 중 빠르게 테스트하기

결제나 실제 30일을 기다리지 않고 상태를 바꿔보고 싶다면, 구독 화면 맨 아래
**개발자 전용** 박스(`__DEV__` 빌드에서만 보임)를 쓰면 됩니다.

- **구독 중으로 설정 / 구독 해제** — 결제 없이 구독 상태만 전환
- **체험 즉시 만료** — 체험 시작일을 31일 전으로 되돌려, 앱을 재시작하면 잠금 화면이
  바로 뜨는지 확인
- **체험 30일 리셋** — 체험 시작일을 지금으로 다시 설정

이 버튼들은 이미 구독 화면에 진입해 있어야 누를 수 있는데, 체험이 끝난 뒤에는 화면이
`blocking` 모드라 개발자 박스도 그 화면 맨 아래에 그대로 나타나므로 테스트에는
문제가 없습니다.

**참고할 한계**: 체험 시작일은 이 기기의 로컬 저장소(AsyncStorage)에만 저장됩니다.
서버 검증이 없으므로, 앱을 완전히 삭제하고 재설치하면(같은 계정으로 로그인해도) 체험이
다시 30일로 리셋됩니다. 실제 서비스라면 로그인 계정 기준으로 서버에 체험 시작일을
저장해 이 허점을 막아야 합니다.

## 폴더 구조

```
App.js                        앱 진입점 (AuthProvider → 로그인 게이트 → AppProvider → 네비게이션)
src/
  config/auth.js                Google OAuth 클라이언트 ID (직접 채워야 함)
  data/
    data.js                     101개 지표 전체 데이터 (기존 웹 버전에서 그대로 이식)
    commodities.js               26개 원자재 데이터 (에너지·귀금속·산업금속·농산물·축산물)
  theme/colors.js               색상 팔레트, 폰트 헬퍼
  utils/storage.js              AsyncStorage 래퍼 (localStorage 대응)
  api/quotes.js                 Stooq 실시간 시세 조회 (지수·채권·원자재 공용)
  context/
    AppContext.js                전역 상태: 나라/연도/필터/사용자 수정값/실시간 시세
    AuthContext.js                로그인 세션 상태 (Google/Apple/게스트), 기기에 영구 저장
    CommoditiesContext.js         원자재 탭 전용 상태 (연도/카테고리/수정값/실시간 시세)
  components/
    TrendChart.js                SVG 차트 (react-native-svg) — 선/막대/영역/계단형
    IndicatorCard.js              2026년 "최신" 모드 카드
    YearCard.js                   과거 연도 모드 카드 (11년 궤적)
    CommodityCard.js               원자재 최신 모드 카드
    CommodityYearCard.js           원자재 연도 모드 카드
    CountrySelector.js            나라 선택 칩
    YearPicker.js                 연도 드롭다운 + 이전/다음
    TemperatureStrip.js           체온 스트립 (탭하면 해당 카드로 스크롤)
    FamilyFilter.js                계열 필터 칩 (지표 탭)
    CategoryFilter.js              카테고리 필터 칩 (원자재 탭)
    CorrelationMatrix.js           상관관계 격자
    Accordion.js                   접이식 섹션
    EditModal.js                   수치 직접 수정 모달
  screens/
    LoginScreen.js                로그인 화면 (Google · Apple · 게스트)
    IndicatorsScreen.js            지표 탭 (메인)
    CommoditiesScreen.js           원자재 탭
    CalendarScreen.js              발표일 탭
    CorrelationScreen.js           상관관계 탭
    SettingsScreen.js              설정 탭 (계정, 시세 심볼, 초기화, 발표처 링크)
  config/iap.js                  인앱결제 상품 ID·가격 설정
  context/SubscriptionContext.js  구독 상태 관리 (react-native-iap 연동)
  screens/SubscriptionScreen.js    구독 화면 (월간/연간 카드, 구매·복원)
  navigation/
    RootTabs.js                    하단 탭 네비게이터 (5개 탭)
    RootNavigator.js                최상위 스택 (탭 + 구독 화면 모달)
```

## 웹 버전과의 차이

| 항목 | 웹(HTML/JSX) | React Native |
|---|---|---|
| 차트 | SVG 문자열 직접 생성 | `react-native-svg` 컴포넌트 |
| 저장소 | `localStorage` (동기) | `AsyncStorage` (비동기 — 최초 로딩 중 스피너 표시) |
| 실시간 시세 | Stooq 호출 시 CORS 프록시 필요할 수 있음 | **네이티브 앱이라 CORS 제약 자체가 없음** — 프록시 불필요 |
| 네비게이션 | 하단 탭 흉내 낸 `<div>` 전환 | `@react-navigation/bottom-tabs` 정식 사용 |
| 폰트 | IBM Plex Sans KR / Mono (웹폰트) | 시스템 기본 폰트 (아래 참고) |

## 커스텀 폰트 추가하기 (선택)

지금은 시스템 기본 폰트를 씁니다. 웹 버전과 똑같이 IBM Plex Sans KR / IBM Plex Mono를
쓰려면:

```bash
npx expo install expo-font
```

`assets/fonts/`에 `.ttf` 파일을 넣고 `App.js`에서 `expo-font`의 `useFonts`로 로드한 뒤,
`src/theme/colors.js`의 `FONT.mono` 값을 그 폰트 이름으로 바꾸면 됩니다.

## 실시간 시세 심볼

설정 탭에서 지수·채권 10종의 Stooq 심볼을 직접 확인·수정할 수 있습니다. 기본값은
`src/api/quotes.js`의 `SYM_DEF`에 있습니다. 이 환경은 네트워크가 없어 심볼이
실제로 맞는지 검증하지 못했으니, 처음 실행 후 꼭 확인해 보세요.
