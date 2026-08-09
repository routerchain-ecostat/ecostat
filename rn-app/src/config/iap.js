// 인앱결제 상품 설정.
// App Store Connect(자동갱신 구독 그룹)와 Google Play Console(구독 → 기본 요금제)에
// 아래와 정확히 같은 상품 ID로 각각 등록해야 실제 결제가 동작한다.
//
//   월간 구독 : monthly_premium  — 월 3,000원
//   연간 구독 : yearly_premium   — 연 20,000원 (월 환산 약 1,667원, 월간 대비 약 44% 절약)
//
// 스토어에 상품을 등록하기 전까지는 getSubscriptions()가 빈 배열을 반환하므로,
// 화면에는 아래 FALLBACK_PRICE를 대신 보여준다. 실제 결제 시점에는 반드시
// 스토어가 내려준 현지 통화 가격(product.localizedPrice)을 우선 사용한다.

export const SKUS = ["monthly_premium", "yearly_premium"];

export const PLAN = {
  monthly_premium: {
    id: "monthly_premium",
    title: "월간 구독",
    period: "매월",
    fallbackPrice: "₩3,000",
    fallbackPriceValue: 3000,
    badge: null,
  },
  yearly_premium: {
    id: "yearly_premium",
    title: "연간 구독",
    period: "매년",
    fallbackPrice: "₩20,000",
    fallbackPriceValue: 20000,
    badge: "약 44% 절약",
  },
};

// 심사(애플·구글) 요구사항 안내 문구에 쓰는 링크 — 실제 배포 시 실제 URL로 교체
export const LEGAL_LINKS = {
  terms: "https://example.com/terms",
  privacy: "https://example.com/privacy",
};
