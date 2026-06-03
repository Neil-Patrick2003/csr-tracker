import axios from "axios";

const api = axios.create({
  baseURL: "https://artemis-dev.on-forge.com/api/v2/public",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": "art_4TGgV4OLrHp5NCGXXuAi3pu0IV9F9eEhRiqLbjFj",
  },
});

export const login = (email, password) =>
  api.post("/rmo-orders/login", { email, password });

export const syncCallLogs = (userId, callLogs) =>
  api.post("/call-logs/sync", {
    user_id: userId,
    call_logs: callLogs,
  });

export const getCallLogKpi = (userId, date) =>
  api.get("/call-logs/kpi", {
    params: {
      assignee_user_id: userId,
      ...(date ? { date } : {}),
    },
  });

export const getCallLogSummary = (userId, sinceTimestamp) =>
  api.get("/call-logs/summary", {
    params: {
      assignee_user_id: userId,
      ...(sinceTimestamp ? { since: sinceTimestamp } : {}),
    },
  });

export const getCallLogs = (userId, sinceMs) =>
  api.get("/call-logs/list", { params: { assignee_user_id: userId, since: sinceMs } });
