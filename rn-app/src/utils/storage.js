import AsyncStorage from "@react-native-async-storage/async-storage";

// 웹 버전의 LS 헬퍼(localStorage 기반)를 AsyncStorage 기반 비동기 버전으로 재구현.
// 키에 "mc_" 접두어를 붙여 다른 앱 데이터와 충돌을 피한다.
const K = (k) => "mc_" + k;

export async function lsGet(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(K(key));
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function lsSet(key, value) {
  try {
    await AsyncStorage.setItem(K(key), JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export async function lsDel(key) {
  try {
    await AsyncStorage.removeItem(K(key));
    return true;
  } catch (e) {
    return false;
  }
}
