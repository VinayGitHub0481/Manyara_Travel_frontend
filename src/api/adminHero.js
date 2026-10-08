

import api from "./axios";

// ============================================================
// PUBLIC HERO APIs
// ============================================================

/**
 * Get currently live Hero slides.
 *
 * Backend:
 * GET /hero
 *
 * Backend automatically filters:
 * - is_active = true
 * - starts_at <= current time OR NULL
 * - ends_at >= current time OR NULL
 *
 * Returns slides ordered by display_order.
 */
export const getHeroSlides = () =>
  api.get("/hero").then((res) => res.data);


// ============================================================
// ADMIN HERO APIs
// ============================================================

/**
 * Get all Hero slides.
 *
 * Includes:
 * - active
 * - inactive
 * - future scheduled
 * - expired scheduled
 *
 * Backend:
 * GET /hero/admin/all
 */
export const getAllHeroSlidesAdmin = () =>
  api.get("/hero/admin/all").then((res) => res.data);


/**
 * Get a single Hero slide by ID.
 *
 * Includes inactive/future/expired slides.
 *
 * Backend:
 * GET /hero/admin/{id}
 */
export const getHeroSlideById = (id) =>
  api.get(`/hero/admin/${id}`).then((res) => res.data);


// ============================================================
// CREATE
// ============================================================

/**
 * Create a new Hero slide.
 *
 * Backend:
 * POST /hero/admin
 */
export const createHeroSlide = (payload) =>
  api.post("/hero/admin", payload).then((res) => res.data);


// ============================================================
// UPDATE
// ============================================================

/**
 * Update an existing Hero slide.
 *
 * Backend:
 * PUT /hero/admin/{id}
 */
export const updateHeroSlide = (id, payload) =>
  api.put(`/hero/admin/${id}`, payload).then((res) => res.data);


// ============================================================
// DELETE
// ============================================================

/**
 * Delete an existing Hero slide.
 *
 * Backend:
 * DELETE /hero/admin/{id}
 *
 * Returns HTTP 204, so there is normally no response body.
 */
export const deleteHeroSlide = (id) =>
  api.delete(`/hero/admin/${id}`);













































// import api from "./axios";

// // ============================================================
// // PUBLIC HERO APIs
// // ============================================================

// /**
//  * Get all active Hero slides.
//  *
//  * Backend:
//  * GET /hero
//  *
//  * Returns slides ordered by display_order.
//  */
// export const getHeroSlides = () =>
//   api.get("/hero").then((res) => res.data);

// /**
//  * Get a Hero slide by ID.
//  *
//  * Backend:
//  * GET /hero/{id}
//  */
// export const getHeroSlideById = (id) =>
//   api.get(`/hero/${id}`).then((res) => res.data);


// // ============================================================
// // ADMIN HERO APIs
// // ============================================================

// /**
//  * Get all Hero slides including inactive slides.
//  *
//  * Backend:
//  * GET /hero/admin/all
//  */
// export const getAllHeroSlidesAdmin = () =>
//   api.get("/hero/admin/all").then((res) => res.data);

// /**
//  * Create a new Hero slide.
//  *
//  * Backend:
//  * POST /hero/admin
//  */
// export const createHeroSlide = (payload) =>
//   api.post("/hero/admin", payload).then((res) => res.data);

// /**
//  * Update an existing Hero slide.
//  *
//  * Backend:
//  * PUT /hero/admin/{id}
//  */
// export const updateHeroSlide = (id, payload) =>
//   api.put(`/hero/admin/${id}`, payload).then((res) => res.data);

// /**
//  * Delete a Hero slide.
//  *
//  * Backend:
//  * DELETE /hero/admin/{id}
//  */
// export const deleteHeroSlide = (id) =>
//   api.delete(`/hero/admin/${id}`).then((res) => res.data);









