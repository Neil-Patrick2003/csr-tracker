import axios from "axios";

const api = axios.create({
  baseURL: "https://stretchy-wanetta-unwinning.ngrok-free.dev/api/v1/public",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": "art_Qt2XWGY1nTPF6ja484Re1UFii8DFJLLmlu9xOjdW",
  },
});

export const login = (search = "") =>
  api.post("/rmo-orders/login", search ? { search } : {});

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
