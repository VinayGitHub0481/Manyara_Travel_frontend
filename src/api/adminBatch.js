

import api from "./axios";

// ============================================================
// ADMIN — PACKAGE BATCHES
// ============================================================

// GET /package-batches/admin/all
// Get all batches for admin
export const getAllBatches = () =>
  api
    .get("/package-batches/admin/all")
    .then((res) => res.data);


// GET /package-batches/admin/:id
// Get a single batch by internal database ID
export const getBatchById = (id) =>
  api
    .get(`/package-batches/admin/${id}`)
    .then((res) => res.data);


// POST /package-batches/admin
// Create a new batch
export const createBatch = (payload) =>
  api
    .post("/package-batches/admin", payload)
    .then((res) => res.data);


// PUT /package-batches/admin/:id
// Update an existing batch
export const updateBatch = (id, payload) =>
  api
    .put(`/package-batches/admin/${id}`, payload)
    .then((res) => res.data);


// DELETE /package-batches/admin/:id
// Delete an existing batch
export const deleteBatch = (id) =>
  api
    .delete(`/package-batches/admin/${id}`)
    .then((res) => res.data);