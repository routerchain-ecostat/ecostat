import Constants, { ExecutionEnvironment } from "expo-constants";

// Expo Go는 자체 네이티브 모듈 세트만 포함하고 있어, react-native-iap처럼
// 별도로 링크해야 하는 서드파티 네이티브 모듈은 아예 존재하지 않는다.
// 이 값으로 "지금 Expo Go 안에서 돌고 있는가"를 판단해 그런 기능을 안전하게 건너뛴다.
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
