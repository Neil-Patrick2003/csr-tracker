import axios from "axios";
import { REACT_APP_API_BASE_URL, REACT_APP_API_KEY } from "../config/env";

const baseURL = "https://artemis.ph/api/v1/public";
const apiKey = "art_optpdFBxXGN7tt4sq0Pi9BeIs7TaRKi3pTuIDa21";

console.log("API Base URL:", baseURL);
console.log("API Key:", apiKey ? "Provided" : "Not Provided");

const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  },
});

export const login = (search = "") =>
  api.post(
    "/rmo-orders/login",
    null,
    search ? { params: { search } } : undefined
  );

export const syncCallLogs = (userId, callLogs) =>
  api.post("/call-logs/sync", {
    user_id: userId,
    call_logs: callLogs,
  });

export const getCallLogKpi = (userId, date) =>
  api.get("/call-logs/kpi", {
    params: {
        user_id: userId,
      ...(date ? { date } : {}),
    },
  });

export const getCallLogSummary = (userId, sinceTimestamp) =>
  api.get("/call-logs/summary", {
    params: {
        user_id: userId,
      ...(sinceTimestamp ? { since: sinceTimestamp } : {}),
    },
  });

export const getCallLogs = (userId, sinceMs) =>
  api.get("/call-logs/list", { params: { user_id: userId, since: sinceMs } });
