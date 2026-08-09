import { IS_EXPO_GO } from "../utils/env";

// react-native-iap은 네이티브 모듈이라 Expo Go에는 존재하지 않는다.
// 이 파일 하나만 거치면, 나머지 코드는 "IAP가 있는지 없는지"를 신경 쓸 필요가 없다.
//
// 중요: 여기서 `require()`를 쓰는 이유가 있다. 최상단에서 `import * as RNIap from
// "react-native-iap"`처럼 정적으로 불러오면, 그 구문은 모듈이 실제로 쓰이는지와
// 무관하게 파일이 평가되는 순간 무조건 실행된다. Expo Go에는 이 네이티브 모듈이
// 없으므로 그 시점에 바로 예외가 던져지고, try/catch로 감쌀 방법이 없어 앱 전체가
// 부팅도 하기 전에 죽는다(정확히 이 문제로 오류가 났던 것이다).
// `require()`를 함수 안에서 호출하면 그 시점에만 실행되므로 try/catch로 감쌀 수 있다.

let RNIap = null;
let loadError = null;

if (!IS_EXPO_GO) {
  try {
    RNIap = require("react-native-iap");
  } catch (e) {
    loadError = e;
    RNIap = null;
  }
}

export const IAP_AVAILABLE = !!RNIap;
export const IAP_UNAVAILABLE_REASON = IS_EXPO_GO
  ? "Expo Go에서는 인앱결제를 사용할 수 없습니다. EAS Build로 만든 개발 빌드가 필요합니다."
  : loadError
  ? "인앱결제 모듈을 불러오지 못했습니다: " + (loadError.message || String(loadError))
  : null;

// 아래는 SubscriptionContext가 실제로 쓰는 함수만 얇게 감싼 것들이다.
// IAP_AVAILABLE이 false면 전부 안전하게 "아무 일도 안 일어난 것"처럼 동작한다.

export async function initConnection() {
  if (!RNIap) return false;
  return RNIap.initConnection();
}

export async function endConnection() {
  if (!RNIap) return;
  return RNIap.endConnection();
}

export async function flushFailedPurchasesCachedAsPendingAndroid() {
  if (!RNIap) return;
  return RNIap.flushFailedPurchasesCachedAsPendingAndroid();
}

export async function getSubscriptions(opts) {
  if (!RNIap) return [];
  return RNIap.getSubscriptions(opts);
}

export async function getAvailablePurchases() {
  if (!RNIap) return [];
  return RNIap.getAvailablePurchases();
}

export async function requestSubscription(opts) {
  if (!RNIap) throw new Error(IAP_UNAVAILABLE_REASON || "인앱결제를 사용할 수 없습니다.");
  return RNIap.requestSubscription(opts);
}

export async function finishTransaction(opts) {
  if (!RNIap) return;
  return RNIap.finishTransaction(opts);
}

export function purchaseUpdatedListener(cb) {
  if (!RNIap) return { remove() {} };
  return RNIap.purchaseUpdatedListener(cb);
}

export function purchaseErrorListener(cb) {
  if (!RNIap) return { remove() {} };
  return RNIap.purchaseErrorListener(cb);
}
