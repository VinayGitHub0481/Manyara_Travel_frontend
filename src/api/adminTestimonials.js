import api from "./axios";

// ============================================================
// PUBLIC TESTIMONIAL / REVIEW APIs
// ============================================================

export const getTestimonials = () =>
  api.get("/testimonials").then((res) => res.data);

export const getTestimonialBySlug = (slug) =>
  api.get(`/testimonials/${slug}`).then((res) => res.data);

export const submitTestimonial = (payload) =>
  api.post("/testimonials", payload).then((res) => res.data);


// ============================================================
// ADMIN TESTIMONIAL APIs
// ============================================================

export const getAllTestimonialsAdmin = () =>
  api.get("/testimonials/admin/all").then((res) => res.data);

export const createTestimonial = (payload) =>
  api.post("/testimonials/admin", payload).then((res) => res.data);

export const updateTestimonial = (id, payload) =>
  api.put(`/testimonials/admin/${id}`, payload).then((res) => res.data);

export const deleteTestimonial = (id) =>
  api.delete(`/testimonials/admin/${id}`);