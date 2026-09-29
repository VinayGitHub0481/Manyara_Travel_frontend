import api from "./axios";

export const getAllPackagesAdmin = () =>
  api.get("/packages/admin/all").then((res) => res.data);

export const createPackage = (payload) =>
  api.post("/packages/admin", payload).then((res) => res.data);

export const updatePackage = (id, payload) =>
  api.put(`/packages/admin/${id}`, payload).then((res) => res.data);

export const deletePackage = (id) => api.delete(`/packages/admin/${id}`);
