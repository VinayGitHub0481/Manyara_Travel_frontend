import api from "./axios";

// FAQs have no draft/published split -> public GET /faqs doubles as the admin list
export const getAllFaqsAdmin = () => api.get("/faqs").then((res) => res.data);

export const createFaq = (payload) =>
  api.post("/faqs/admin", payload).then((res) => res.data);

export const updateFaq = (id, payload) =>
  api.put(`/faqs/admin/${id}`, payload).then((res) => res.data);

export const deleteFaq = (id) => api.delete(`/faqs/admin/${id}`);
