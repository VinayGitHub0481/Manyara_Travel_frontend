

import api from "./axios";

// ============================================================
// ADMIN POLICY API
// ============================================================

// Get all policies for admin
export const getAllPoliciesAdmin = async () => {
  const response = await api.get("/policies/admin/all");
  return response.data;
};

// Get a single policy by ID
export const getPolicy = async (policyId) => {
  const response = await api.get(`/policies/${policyId}`);
  return response.data;
};

// Create policy
export const createPolicy = async (payload) => {
  const response = await api.post("/policies/admin", payload);
  return response.data;
};

// Update policy
export const updatePolicy = async (policyId, payload) => {
  const response = await api.put(`/policies/admin/${policyId}`, payload);
  return response.data;
};

// Delete policy
export const deletePolicy = async (policyId) => {
  await api.delete(`/policies/admin/${policyId}`);
};

// ============================================================
// PUBLIC POLICY API
// ============================================================

// Get published policies
export const getPublishedPolicies = async () => {
  const response = await api.get("/policies");
  return response.data;
};
