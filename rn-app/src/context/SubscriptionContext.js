import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as IAP from "../api/iapSafe";
import { IAP_AVAILABLE, IAP_UNAVAILABLE_REASON } from "../api/iapSafe";
import { lsGet, lsSet, lsDel } from "../utils/storage";
import { SKUS, PLAN } from "../config/iap";

const SubscriptionContext = createContext(null);

const TRIAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

// ⚠️ 이 앱은 영수증을 검증해 줄 백엔드가 없다. 그래서 "구독 중" 여부를
// 기기에 캐시된 값으로만 판단한다(로컬 신뢰 방식). 실제 서비스로 배포할 때는
// 반드시 App Store Server API / Google Play Developer API로 서버에서 영수증을
// 검증하고, 그 결과를 이 컨텍스트가 신뢰하도록 바꿔야 한다. 지금 구조는
// "구매가 실제로 일어나고 UI가 그에 맞춰 잠금 해제되는지"까지만 보장한다.
//
// 결제(react-native-iap)는 src/api/iapSafe.js를 거쳐서만 접근한다. Expo Go처럼
// 그 네이티브 모듈이 없는 환경에서도 이 컨텍스트, 그리고 30일 무료 체험 로직 자체는
// 정상 동작한다 — 실제 결제 기능만 비활성화된다.
export function SubscriptionProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState([]); // 스토어에서 내려준 실제 상품 정보
  const [entitlement, setEntitlement] = useState(null); // { productId, purchaseTime } | null
  const [purchasing, setPurchasing] = useState(null); // sku | null
  const [restoring, setRestoring] = useState(false);
  const [lastError, setLastError] = useState(IAP_AVAILABLE ? null : IAP_UNAVAILABLE_REASON);
  const [trialStart, setTrialStart] = useState(null); // 최초 실행 시각(ms) — 30일 무료 체험의 기준

  const updateSub = useRef(null);
  const errorSub = useRef(null);

  const isSubscribed = !!entitlement;

  const persistEntitlement = useCallback(async (val) => {
    setEntitlement(val);
    if (val) await lsSet("entitlement", val);
    else await lsDel("entitlement");
  }, []);

  // 구매 성공/복원 결과를 공통으로 처리
  const handlePurchase = useCallback(
    async (purchase) => {
      try {
        await persistEntitlement({
          productId: purchase.productId,
          purchaseTime: purchase.transactionDate || Date.now(),
        });
        // 소모성이 아닌 구독 상품이므로 isConsumable: false. 트랜잭션을 완료 처리해야
        // 스토어 큐에 계속 남아 반복 알림이 뜨는 것을 막는다.
        await IAP.finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        setLastError(e.message || "구매 완료 처리 중 오류가 발생했습니다");
      }
    },
    [persistEntitlement]
  );

  useEffect(() => {
    (async () => {
      const cached = await lsGet("entitlement", null);
      setEntitlement(cached || null);

      // 30일 무료 체험 시작 시각. 앱을 처음 실행한 순간 딱 한 번만 기록하고,
      // 그 뒤로는 절대 갱신하지 않는다(재설치해도 로그인 계정이 같으면 서버 검증이
      // 있어야 정확히 이어지지만, 지금은 기기 로컬 값이라 앱을 지우고 다시 깔면
      // 체험이 다시 시작될 수 있다는 한계가 있다 — README/한계 설명 참고).
      let start = await lsGet("trial_start", null);
      if (!start) {
        start = Date.now();
        await lsSet("trial_start", start);
      }
      setTrialStart(start);

      // IAP_AVAILABLE이 false면(Expo Go 등) 스토어 연결을 아예 시도하지 않는다.
      // iapSafe.js의 모든 함수가 이미 안전하게 no-op이지만, 여기서 한 번 더
      // 걸러서 불필요한 대기 시간 없이 곧바로 ready 상태로 넘어가게 한다.
      if (IAP_AVAILABLE) {
        try {
          await IAP.initConnection();
          setConnected(true);

          if (Platform.OS === "android") {
            // 안드로이드에서 미처리된 구매가 남아있으면 정리
            try { await IAP.flushFailedPurchasesCachedAsPendingAndroid(); } catch (e) {}
          }

          const subs = await IAP.getSubscriptions({ skus: SKUS });
          setProducts(subs || []);

          // 구매 이벤트 리스너 등록
          updateSub.current = IAP.purchaseUpdatedListener((purchase) => {
            handlePurchase(purchase);
          });
          errorSub.current = IAP.purchaseErrorListener((err) => {
            setLastError(err.message || "결제 중 오류가 발생했습니다");
            setPurchasing(null);
          });

          // 이미 보유한 구매가 있으면(재설치 등) 자동으로 복원
          const owned = await IAP.getAvailablePurchases();
          if (owned && owned.length) {
            const latest = owned.sort(
              (a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)
            )[0];
            await persistEntitlement({
              productId: latest.productId,
              purchaseTime: latest.transactionDate || Date.now(),
            });
          }
        } catch (e) {
          // 스토어 상품 미등록 등 다른 이유로도 여기서 실패할 수 있다.
          // 실패해도 앱은 정상 동작하고, 캐시된 구독 상태와 체험 기간만 보여준다.
          setLastError(e.message || "스토어 연결에 실패했습니다");
        }
      }

      setReady(true);
    })();

    return () => {
      updateSub.current?.remove();
      errorSub.current?.remove();
      IAP.endConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceFor = useCallback(
    (sku) => {
      const p = products.find((x) => x.productId === sku);
      return p?.localizedPrice || PLAN[sku]?.fallbackPrice || "";
    },
    [products]
  );

  const subscribe = useCallback(async (sku) => {
    setLastError(null);
    setPurchasing(sku);
    try {
      await IAP.requestSubscription({ sku });
      // 성공/실패 결과는 위의 purchaseUpdatedListener / purchaseErrorListener로 비동기 전달된다.
    } catch (e) {
      setLastError(e.message || "결제를 시작하지 못했습니다");
      setPurchasing(null);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setLastError(null);
    setRestoring(true);
    try {
      const owned = await IAP.getAvailablePurchases();
      if (owned && owned.length) {
        const latest = owned.sort(
          (a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)
        )[0];
        await persistEntitlement({
          productId: latest.productId,
          purchaseTime: latest.transactionDate || Date.now(),
        });
        return { ok: true, found: true };
      }
      return { ok: true, found: false };
    } catch (e) {
      setLastError(e.message || "구매 내역을 복원하지 못했습니다");
      return { ok: false };
    } finally {
      setRestoring(false);
    }
  }, [persistEntitlement]);

  // 구매 이벤트가 성공적으로 처리되면 구매 중 상태를 해제
  useEffect(() => {
    if (entitlement) setPurchasing(null);
  }, [entitlement]);

  // 개발/테스트용: 결제 없이 구독 상태를 직접 껐다 켜보고 싶을 때
  const devSetSubscribed = useCallback(
    (on) => persistEntitlement(on ? { productId: "monthly_premium", purchaseTime: Date.now() } : null),
    [persistEntitlement]
  );

  const daysSinceTrialStart = trialStart ? Math.floor((Date.now() - trialStart) / DAY_MS) : 0;
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceTrialStart);
  const trialActive = !isSubscribed && trialDaysLeft > 0;
  const trialExpired = !isSubscribed && trialDaysLeft <= 0;
  const hasAccess = isSubscribed || trialActive;

  // 개발/테스트용: 체험 기간을 즉시 만료시켜 잠금 화면을 미리 보고 싶을 때
  const devExpireTrial = useCallback(async () => {
    const past = Date.now() - (TRIAL_DAYS + 1) * DAY_MS;
    await lsSet("trial_start", past);
    setTrialStart(past);
  }, []);
  const devResetTrial = useCallback(async () => {
    const now = Date.now();
    await lsSet("trial_start", now);
    setTrialStart(now);
  }, []);

  const value = {
    ready, connected, products, entitlement, isSubscribed,
    purchasing, restoring, lastError, iapAvailable: IAP_AVAILABLE,
    priceFor, subscribe, restorePurchases, devSetSubscribed,
    trialDaysLeft, trialActive, trialExpired, hasAccess,
    devExpireTrial, devResetTrial,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}
