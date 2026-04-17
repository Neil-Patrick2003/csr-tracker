import axios from "axios";

const api = axios.create({
  baseURL: "https://artemis-dev.on-forge.com/api/v1/public",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    // "X-API-Key": "art_BgTc2rfztkpwluWK2QxqG0sxY141CGvcNIfnKsI8",
    // "X-API-Key": "art_Qt2XWGY1nTPF6ja484Re1UFii8DFJLLmlu9xOjdW",
    "X-API-Key": "art_4TGgV4OLrHp5NCGXXuAi3pu0IV9F9eEhRiqLbjFj",
  },
});

export const login = (search = "") =>
  api.post("/rmo-orders/login", search ? { search } : {});

export const getPages = () => api.get("/pages");
export const getShops = () => api.get("/shops");

export const getAssignedOrders = (userId, filters = {}, page = 1, perPage = 15) =>
  api.get("/rmo-orders", {
    params: {
      user_id: userId,
      page,
      per_page: perPage,
      "filter[page_id]": filters.page_id,
      "filter[shop_id]": filters.shop_id,
      "filter[status]": filters.status,
      "filter[parcel_status]": filters.parcel_status,
      "filter[search]": filters.search,
    },
  });

export const syncCallTracking = (orders) =>
  api.post("/rmo-orders/sync-call-tracking", { orders });