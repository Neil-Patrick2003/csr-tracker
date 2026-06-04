import Constants from "expo-constants";

// Access environment config from app.json extra field
const appConfig = Constants.expoConfig?.extra || {};

export const REACT_APP_API_BASE_URL =
  appConfig.apiBaseUrl || "https://artemis.ph/api/v1/public";

export const REACT_APP_API_KEY =
  appConfig.apiKey || "";

console.log("API Config:", {
  baseUrl: REACT_APP_API_BASE_URL,
  keyProvided: !!REACT_APP_API_KEY,
});

export default {
  REACT_APP_API_BASE_URL,
  REACT_APP_API_KEY,
};

