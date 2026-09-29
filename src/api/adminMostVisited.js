import api from "./axios";

export const getAllMostVisitedAdmin = () =>
  api.get("/most-visited").then((res) => res.data);

export const createMostVisited = (payload) =>
  api.post("/most-visited/admin", payload).then((res) => res.data);

export const updateMostVisited = (id, payload) =>
  api.put(`/most-visited/admin/${id}`, payload).then((res) => res.data);

export const deleteMostVisited = (id) => api.delete(`/most-visited/admin/${id}`);
