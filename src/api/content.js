import api from "./axios";

// GET /packages -> published packages only (public, cached in Redis on backend)
export const getPackages = (params = {}) =>
  api.get("/packages", { params }).then((res) => res.data);


// GET /packages/:id
export const getPackageById = (id) =>
  api.get(`/packages/${id}`).then((res) => res.data);

// --- Added for SEO detail pages / new sections ---
// NOTE: these assume matching FastAPI routes that return objects including
// a `slug` field. If your backend doesn't have these yet, add them -
// slugs are what make clean, indexable URLs like /packages/goa-3n4d possible
// instead of /packages/12.

// GET /packages/slug/:slug
export const getPackageBySlug = (slug) =>
  api.get(`/packages/slug/${slug}`).then((res) => res.data);

// Optional helper for collection-based discovery.
// Examples:
// getPopularPackages()
// getRecommendedPackages()
// getMostVisitedPackages()
export const getPackagesByCollection = (collection) =>
  api
    .get("/packages", {
      params: { collection },
    })
    .then((res) => res.data);

//----------------------------------------------------------------------------------------------
// GET /testimonials -> published only
export const getTestimonials = () =>
  api.get("/testimonials").then((res) => res.data);

//create testiominals form 
export const createTestimonial = (payload) =>
  api.post("/testimonials", payload).then((res) => res.data);


export const getTestimonialBySlug = async (slug) => {
  const response = await api.get(
    `/testimonials/${encodeURIComponent(slug)}`
  );

  return response.data;
};


//========================================================================================

// GET /faqs -> all (no draft/published state on backend)
export const getFaqs = () => api.get("/faqs").then((res) => res.data);

// GET /most-visited
export const getMostVisited = () =>
  api.get("/most-visited").then((res) => res.data);


// GET /most-visited/slug/:slug
export const getMostVisitedBySlug = (slug) =>
  api.get(`/most-visited/slug/${slug}`).then((res) => res.data);


//------------------------------------------------------------------
// GET /blogs -> published only
export const getBlogs = () => api.get("/blogs").then((res) => res.data);

// GET /blogs/slug/:slug
export const getBlogBySlug = (slug) =>
  api.get(`/blogs/slug/${slug}`).then((res) => res.data);


// GET /blogs/admin/all -> all blogs for admin
export const getAllBlogs = () =>
  api.get("/blogs/admin/all").then((res) => res.data);

// POST /blogs/admin -> create blog
export const createBlog = (payload) =>
  api.post("/blogs/admin", payload).then((res) => res.data);

// PUT /blogs/admin/:id -> update blog
export const updateBlog = (id, payload) =>
  api.put(`/blogs/admin/${id}`, payload).then((res) => res.data);

// DELETE /blogs/admin/:id -> delete blog
export const deleteBlog = (id) =>
  api.delete(`/blogs/admin/${id}`);

//----------------------------------------------------------------------------

// ============================================================
// GET ALL HAPPY MOMENTS
// ============================================================

export const getHappyMoments = () =>
  api
    .get("/happy-moments")
    .then((res) => res.data);


// ============================================================
// GET FEATURED HAPPY MOMENTS
// Homepage → maximum 6 moments
// ============================================================

export const getFeaturedHappyMoments = (limit = 6) =>
  api
    .get(`/happy-moments/featured?limit=${limit}`)
    .then((res) => res.data);


// ============================================================
// GET SINGLE HAPPY MOMENT BY SLUG
// Public detail page
// Example:
// /happy-moments/perfect-goa-escape
// ============================================================

export const getHappyMomentBySlug = (slug) =>
  api
    .get(`/happy-moments/${slug}`)
    .then((res) => res.data);


// ============================================================
// ADMIN CREATE HAPPY MOMENT
// ============================================================

export const createHappyMoment = (payload) =>
  api
    .post("/happy-moments/admin", payload)
    .then((res) => res.data);


// ============================================================
// ADMIN UPDATE HAPPY MOMENT
// Uses internal database ID
// ============================================================

export const updateHappyMoment = (id, payload) =>
  api
    .put(`/happy-moments/admin/${id}`, payload)
    .then((res) => res.data);


// ============================================================
// ADMIN DELETE HAPPY MOMENT
// ============================================================

export const deleteHappyMoment = (id) =>
  api
    .delete(`/happy-moments/admin/${id}`);


//====================================================================
//About section management
//=====================================================================

export const getAbout = () =>
  api.get("/about").then((res) => res.data);

export const getLeadership = () =>
  api.get("/about/leadership").then((res) => res.data);

export const getLeadershipBySlug = (slug) =>
  api.get(`/about/leadership/${slug}`).then((res) => res.data);

export const getTeamMembers = () =>
  api.get("/about/team").then((res) => res.data);

export const getTeamMemberBySlug = (slug) =>
  api.get(`/about/team/${slug}`).then((res) => res.data);

// ============================================================
// SITE SETTINGS
// ============================================================

// GET /settings
// Public site settings used by Footer, Contact section, TopInfoBar, etc.
export const getSiteSettings = () =>
  api.get("/settings").then((res) => res.data);


// PUT /settings/admin
// Admin updates site settings
export const updateSiteSettings = (payload) =>
  api.put("/settings/admin", payload).then((res) => res.data);
//===========================================================================

// ============================================================
// PACKAGE BATCHES
// ============================================================

// GET /package-batches/upcoming
// Public → published upcoming batches only
export const getUpcomingBatches = () =>
  api
    .get("/package-batches/upcoming")
    .then((res) => res.data);


// GET /package-batches/slug/:slug
// Public → single batch detail by SEO-friendly slug
// Example:
// /package-batches/kerala-backwaters-hills-2026-10-10
export const getBatchBySlug = (slug) =>
  api
    .get(`/package-batches/slug/${encodeURIComponent(slug)}`)
    .then((res) => res.data);


// GET /package-batches/package/:package_id
// Public → all batches belonging to a package
export const getBatchesByPackage = (packageId) =>
  api
    .get(`/package-batches/package/${packageId}`)
    .then((res) => res.data);