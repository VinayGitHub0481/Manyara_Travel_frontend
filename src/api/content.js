
import api from "./axios";

/* ============================================================
   ON A TRIP HOLIDAYS
   CONTENT API + CLIENT-SIDE CACHE

   Cache strategy:

   1. Memory cache
      - Fastest
      - Works while SPA is running
      - Makes route navigation instant

   2. localStorage cache
      - Survives browser refresh
      - Survives closing/reopening the tab
      - Allows content to appear immediately after refresh

   3. Background refresh
      - Old cached content is shown immediately
      - API request runs silently in background
      - Fresh data replaces old cache

   Existing components do NOT need to change.
   ============================================================ */


/* ============================================================
   CACHE CONFIGURATION
   ============================================================ */

/*
  How long cached data is considered fresh.

  5 minutes is a good value for your public travel website.

  IMPORTANT:
  Even after 5 minutes, old data is still displayed immediately.
  The API is simply refreshed in the background.
*/
const CACHE_TTL = 5 * 60 * 1000;


/*
  Prefix prevents collisions with other localStorage data.
*/
const STORAGE_PREFIX = "onatrip_cache:";


/*
  In-memory cache.

  Structure:

  key -> {
    data,
    timestamp
  }
*/
const memoryCache = new Map();


/*
  Prevent multiple identical API requests from happening
  simultaneously.

  Example:

  Two components call getSiteSettings() at the same time.

  Instead of:

  request 1 → API
  request 2 → API

  they can share the same request.
*/
const pendingRequests = new Map();


/* ============================================================
   CACHE KEY
   ============================================================ */

const getStorageKey = (key) => `${STORAGE_PREFIX}${key}`;


/* ============================================================
   READ FROM localStorage
   ============================================================ */

const readLocalCache = (key) => {
  try {
    const raw = localStorage.getItem(getStorageKey(key));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("data" in parsed) ||
      !("timestamp" in parsed)
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(
      `Failed to read localStorage cache for "${key}":`,
      error
    );

    return null;
  }
};


/* ============================================================
   WRITE TO localStorage
   ============================================================ */

const writeLocalCache = (key, data) => {
  try {
    localStorage.setItem(
      getStorageKey(key),
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    /*
      localStorage can fail because of:

      - storage quota
      - private browsing restrictions
      - browser settings
      - unusually large response

      The application should continue working normally.
    */

    console.warn(
      `Failed to write localStorage cache for "${key}":`,
      error
    );
  }
};


/* ============================================================
   REMOVE ONE CACHE ENTRY
   ============================================================ */

export const clearCache = (key) => {
  /*
    Remove memory cache.
  */
  memoryCache.delete(key);

  /*
    Remove localStorage cache.
  */
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.warn(
      `Failed to remove localStorage cache for "${key}":`,
      error
    );
  }
};


/* ============================================================
   REMOVE RELATED CACHE ENTRIES
   ============================================================ */

export const clearCacheByPrefix = (prefix) => {
  /*
    Memory cache
  */
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  /*
    localStorage
  */
  try {
    const fullPrefix = getStorageKey(prefix);

    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);

      if (key && key.startsWith(fullPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn(
      `Failed to clear localStorage cache prefix "${prefix}":`,
      error
    );
  }
};


/* ============================================================
   CLEAR ENTIRE ON A TRIP CACHE
   ============================================================ */

export const clearAllCache = () => {
  /*
    Clear memory.
  */
  memoryCache.clear();

  /*
    Clear only our application's cache entries.

    IMPORTANT:
    We do NOT call localStorage.clear()
    because that would delete unrelated application/browser data.
  */

  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);

      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("Failed to clear On a Trip cache:", error);
  }
};


/* ============================================================
   BACKGROUND REFRESH
   ============================================================ */

const refreshInBackground = (key, requestFn) => {
  /*
    If this exact request is already running,
    don't start another one.
  */

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = Promise.resolve()
    .then(() => requestFn())
    .then((data) => {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };

      /*
        Update memory.
      */
      memoryCache.set(key, cacheEntry);

      /*
        Update localStorage.
      */
      writeLocalCache(key, data);

      return data;
    })
    .catch((error) => {
      /*
        Background refresh failures should NOT break the page.

        The user already has cached content.
      */

      console.warn(
        `Background refresh failed for "${key}":`,
        error
      );

      return null;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);

  return request;
};


/* ============================================================
   CACHED GET REQUEST
   ============================================================ */

const cachedRequest = async (key, requestFn) => {
  const now = Date.now();

  /* ==========================================================
     STEP 1
     MEMORY CACHE
     ========================================================== */

  const memory = memoryCache.get(key);

  if (memory) {
    const age = now - memory.timestamp;

    /*
      Fresh memory cache.

      Return immediately.

      NO API REQUEST.
    */
    if (age < CACHE_TTL) {
      return memory.data;
    }

    /*
      Stale memory cache.

      Return old data immediately.

      Refresh API in background.
    */

    refreshInBackground(key, requestFn);

    return memory.data;
  }


  /* ==========================================================
     STEP 2
     localStorage CACHE
     ========================================================== */

  const stored = readLocalCache(key);

  if (stored) {
    /*
      Put localStorage data into memory.

      Future route navigation becomes even faster.
    */
    memoryCache.set(key, stored);

    const age = now - stored.timestamp;

    /*
      Fresh localStorage cache.

      Return immediately.
    */
    if (age < CACHE_TTL) {
      return stored.data;
    }

    /*
      Stale localStorage cache.

      Still return immediately.

      Refresh in background.
    */

    refreshInBackground(key, requestFn);

    return stored.data;
  }


  /* ==========================================================
     STEP 3
     NO CACHE
     ========================================================== */

  /*
    First-ever request.

    We need to wait for the API.
  */

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = Promise.resolve()
    .then(() => requestFn())
    .then((data) => {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };

      /*
        Save to memory.
      */
      memoryCache.set(key, cacheEntry);

      /*
        Save to localStorage.
      */
      writeLocalCache(key, data);

      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);

  return request;
};


/* ============================================================
   PACKAGES
   ============================================================ */

/*
  GET /packages
*/
export const getPackages = (params = {}) => {
  const queryKey = JSON.stringify(params);

  return cachedRequest(
    `packages:${queryKey}`,
    () =>
      api
        .get("/packages", {
          params,
        })
        .then((res) => res.data)
  );
};


/*
  GET /packages/:id
*/
export const getPackageById = (id) =>
  cachedRequest(
    `package:${id}`,
    () =>
      api
        .get(`/packages/${id}`)
        .then((res) => res.data)
  );


/*
  GET /packages/slug/:slug
*/
export const getPackageBySlug = (slug) =>
  cachedRequest(
    `package-slug:${slug}`,
    () =>
      api
        .get(`/packages/slug/${slug}`)
        .then((res) => res.data)
  );


/*
  GET /packages?collection=:collection
*/
export const getPackagesByCollection = (collection) =>
  cachedRequest(
    `packages-collection:${collection}`,
    () =>
      api
        .get("/packages", {
          params: {
            collection,
          },
        })
        .then((res) => res.data)
  );


/* ============================================================
   TESTIMONIALS
   ============================================================ */

/*
  GET /testimonials
*/
export const getTestimonials = () =>
  cachedRequest(
    "testimonials",
    () =>
      api
        .get("/testimonials")
        .then((res) => res.data)
  );


/*
  POST /testimonials

  NOT cached.
*/
export const createTestimonial = (payload) =>
  api
    .post("/testimonials", payload)
    .then((res) => res.data);


/*
  GET /testimonials/:slug
*/
export const getTestimonialBySlug = (slug) =>
  cachedRequest(
    `testimonial-slug:${slug}`,
    () =>
      api
        .get(
          `/testimonials/${encodeURIComponent(slug)}`
        )
        .then((res) => res.data)
  );


/* ============================================================
   FAQS
   ============================================================ */

/*
  GET /faqs
*/
export const getFaqs = () =>
  cachedRequest(
    "faqs",
    () =>
      api
        .get("/faqs")
        .then((res) => res.data)
  );


/* ============================================================
   MOST VISITED
   ============================================================ */

/*
  GET /most-visited
*/
export const getMostVisited = () =>
  cachedRequest(
    "most-visited",
    () =>
      api
        .get("/most-visited")
        .then((res) => res.data)
  );


/*
  GET /most-visited/slug/:slug
*/
export const getMostVisitedBySlug = (slug) =>
  cachedRequest(
    `most-visited-slug:${slug}`,
    () =>
      api
        .get(`/most-visited/slug/${slug}`)
        .then((res) => res.data)
  );


/* ============================================================
   BLOGS
   ============================================================ */

/*
  GET /blogs
*/
export const getBlogs = () =>
  cachedRequest(
    "blogs",
    () =>
      api
        .get("/blogs")
        .then((res) => res.data)
  );


/*
  GET /blogs/slug/:slug
*/
export const getBlogBySlug = (slug) =>
  cachedRequest(
    `blog-slug:${slug}`,
    () =>
      api
        .get(`/blogs/slug/${slug}`)
        .then((res) => res.data)
  );


/* ============================================================
   ADMIN BLOGS
   ============================================================ */

/*
  GET /blogs/admin/all
*/
export const getAllBlogs = () =>
  cachedRequest(
    "admin-blogs",
    () =>
      api
        .get("/blogs/admin/all")
        .then((res) => res.data)
  );


/*
  POST /blogs/admin
*/
export const createBlog = (payload) =>
  api
    .post("/blogs/admin", payload)
    .then((res) => res.data);


/*
  PUT /blogs/admin/:id
*/
export const updateBlog = (id, payload) =>
  api
    .put(`/blogs/admin/${id}`, payload)
    .then((res) => res.data);


/*
  DELETE /blogs/admin/:id
*/
export const deleteBlog = (id) =>
  api.delete(`/blogs/admin/${id}`);


/* ============================================================
   HAPPY MOMENTS
   ============================================================ */

/*
  GET /happy-moments
*/
export const getHappyMoments = () =>
  cachedRequest(
    "happy-moments",
    () =>
      api
        .get("/happy-moments")
        .then((res) => res.data)
  );


/*
  GET /happy-moments/featured?limit=:limit
*/
export const getFeaturedHappyMoments = (limit = 6) =>
  cachedRequest(
    `happy-moments-featured:${limit}`,
    () =>
      api
        .get(`/happy-moments/featured?limit=${limit}`)
        .then((res) => res.data)
  );


/*
  GET /happy-moments/:slug
*/
export const getHappyMomentBySlug = (slug) =>
  cachedRequest(
    `happy-moment-slug:${slug}`,
    () =>
      api
        .get(`/happy-moments/${slug}`)
        .then((res) => res.data)
  );


/* ============================================================
   ADMIN HAPPY MOMENTS
   ============================================================ */

/*
  POST /happy-moments/admin
*/
export const createHappyMoment = (payload) =>
  api
    .post("/happy-moments/admin", payload)
    .then((res) => res.data);


/*
  PUT /happy-moments/admin/:id
*/
export const updateHappyMoment = (id, payload) =>
  api
    .put(`/happy-moments/admin/${id}`, payload)
    .then((res) => res.data);


/*
  DELETE /happy-moments/admin/:id
*/
export const deleteHappyMoment = (id) =>
  api.delete(`/happy-moments/admin/${id}`);


/* ============================================================
   ABOUT
   ============================================================ */

/*
  GET /about
*/
export const getAbout = () =>
  cachedRequest(
    "about",
    () =>
      api
        .get("/about")
        .then((res) => res.data)
  );


/*
  GET /about/leadership
*/
export const getLeadership = () =>
  cachedRequest(
    "leadership",
    () =>
      api
        .get("/about/leadership")
        .then((res) => res.data)
  );


/*
  GET /about/leadership/:slug
*/
export const getLeadershipBySlug = (slug) =>
  cachedRequest(
    `leadership-slug:${slug}`,
    () =>
      api
        .get(`/about/leadership/${slug}`)
        .then((res) => res.data)
  );


/*
  GET /about/team
*/
export const getTeamMembers = () =>
  cachedRequest(
    "team-members",
    () =>
      api
        .get("/about/team")
        .then((res) => res.data)
  );


/*
  GET /about/team/:slug
*/
export const getTeamMemberBySlug = (slug) =>
  cachedRequest(
    `team-member-slug:${slug}`,
    () =>
      api
        .get(`/about/team/${slug}`)
        .then((res) => res.data)
  );


/* ============================================================
   SITE SETTINGS
   ============================================================ */

/*
  GET /settings
*/
export const getSiteSettings = () =>
  cachedRequest(
    "site-settings",
    () =>
      api
        .get("/settings")
        .then((res) => res.data)
  );


/*
  PUT /settings/admin

  After successful update:

  1. Update API response in memory
  2. Update localStorage

  So the new settings are immediately available.
*/
export const updateSiteSettings = (payload) =>
  api
    .put("/settings/admin", payload)
    .then((res) => {
      const data = res.data;

      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };

      memoryCache.set(
        "site-settings",
        cacheEntry
      );

      writeLocalCache(
        "site-settings",
        data
      );

      return data;
    });


/* ============================================================
   PACKAGE BATCHES
   ============================================================ */

/*
  GET /package-batches/upcoming
*/
export const getUpcomingBatches = () =>
  cachedRequest(
    "upcoming-batches",
    () =>
      api
        .get("/package-batches/upcoming")
        .then((res) => res.data)
  );


/*
  GET /package-batches/slug/:slug
*/
export const getBatchBySlug = (slug) =>
  cachedRequest(
    `batch-slug:${slug}`,
    () =>
      api
        .get(
          `/package-batches/slug/${encodeURIComponent(slug)}`
        )
        .then((res) => res.data)
  );


/*
  GET /package-batches/package/:package_id
*/
export const getBatchesByPackage = (packageId) =>
  cachedRequest(
    `batches-package:${packageId}`,
    () =>
      api
        .get(`/package-batches/package/${packageId}`)
        .then((res) => res.data)
  );






































// import api from "./axios";


// // GET /packages -> published packages only (public, cached in Redis on backend)
// export const getPackages = (params = {}) =>
//   api.get("/packages", { params }).then((res) => res.data);


// // GET /packages/:id
// export const getPackageById = (id) =>
//   api.get(`/packages/${id}`).then((res) => res.data);

// // --- Added for SEO detail pages / new sections ---
// // NOTE: these assume matching FastAPI routes that return objects including
// // a `slug` field. If your backend doesn't have these yet, add them -
// // slugs are what make clean, indexable URLs like /packages/goa-3n4d possible
// // instead of /packages/12.

// // GET /packages/slug/:slug
// export const getPackageBySlug = (slug) =>
//   api.get(`/packages/slug/${slug}`).then((res) => res.data);

// // Optional helper for collection-based discovery.
// // Examples:
// // getPopularPackages()
// // getRecommendedPackages()
// // getMostVisitedPackages()
// export const getPackagesByCollection = (collection) =>
//   api
//     .get("/packages", {
//       params: { collection },
//     })
//     .then((res) => res.data);

// //----------------------------------------------------------------------------------------------
// // GET /testimonials -> published only
// export const getTestimonials = () =>
//   api.get("/testimonials").then((res) => res.data);

// //create testiominals form 
// export const createTestimonial = (payload) =>
//   api.post("/testimonials", payload).then((res) => res.data);


// export const getTestimonialBySlug = async (slug) => {
//   const response = await api.get(
//     `/testimonials/${encodeURIComponent(slug)}`
//   );

//   return response.data;
// };


// //========================================================================================

// // GET /faqs -> all (no draft/published state on backend)
// export const getFaqs = () => api.get("/faqs").then((res) => res.data);

// // GET /most-visited
// export const getMostVisited = () =>
//   api.get("/most-visited").then((res) => res.data);


// // GET /most-visited/slug/:slug
// export const getMostVisitedBySlug = (slug) =>
//   api.get(`/most-visited/slug/${slug}`).then((res) => res.data);


// //------------------------------------------------------------------
// // GET /blogs -> published only
// export const getBlogs = () => api.get("/blogs").then((res) => res.data);

// // GET /blogs/slug/:slug
// export const getBlogBySlug = (slug) =>
//   api.get(`/blogs/slug/${slug}`).then((res) => res.data);


// // GET /blogs/admin/all -> all blogs for admin
// export const getAllBlogs = () =>
//   api.get("/blogs/admin/all").then((res) => res.data);

// // POST /blogs/admin -> create blog
// export const createBlog = (payload) =>
//   api.post("/blogs/admin", payload).then((res) => res.data);

// // PUT /blogs/admin/:id -> update blog
// export const updateBlog = (id, payload) =>
//   api.put(`/blogs/admin/${id}`, payload).then((res) => res.data);

// // DELETE /blogs/admin/:id -> delete blog
// export const deleteBlog = (id) =>
//   api.delete(`/blogs/admin/${id}`);

// //----------------------------------------------------------------------------

// // ============================================================
// // GET ALL HAPPY MOMENTS
// // ============================================================

// export const getHappyMoments = () =>
//   api
//     .get("/happy-moments")
//     .then((res) => res.data);


// // ============================================================
// // GET FEATURED HAPPY MOMENTS
// // Homepage → maximum 6 moments
// // ============================================================

// export const getFeaturedHappyMoments = (limit = 6) =>
//   api
//     .get(`/happy-moments/featured?limit=${limit}`)
//     .then((res) => res.data);


// // ============================================================
// // GET SINGLE HAPPY MOMENT BY SLUG
// // Public detail page
// // Example:
// // /happy-moments/perfect-goa-escape
// // ============================================================

// export const getHappyMomentBySlug = (slug) =>
//   api
//     .get(`/happy-moments/${slug}`)
//     .then((res) => res.data);


// // ============================================================
// // ADMIN CREATE HAPPY MOMENT
// // ============================================================

// export const createHappyMoment = (payload) =>
//   api
//     .post("/happy-moments/admin", payload)
//     .then((res) => res.data);


// // ============================================================
// // ADMIN UPDATE HAPPY MOMENT
// // Uses internal database ID
// // ============================================================

// export const updateHappyMoment = (id, payload) =>
//   api
//     .put(`/happy-moments/admin/${id}`, payload)
//     .then((res) => res.data);


// // ============================================================
// // ADMIN DELETE HAPPY MOMENT
// // ============================================================

// export const deleteHappyMoment = (id) =>
//   api
//     .delete(`/happy-moments/admin/${id}`);


// //====================================================================
// //About section management
// //=====================================================================

// export const getAbout = () =>
//   api.get("/about").then((res) => res.data);

// export const getLeadership = () =>
//   api.get("/about/leadership").then((res) => res.data);

// export const getLeadershipBySlug = (slug) =>
//   api.get(`/about/leadership/${slug}`).then((res) => res.data);

// export const getTeamMembers = () =>
//   api.get("/about/team").then((res) => res.data);

// export const getTeamMemberBySlug = (slug) =>
//   api.get(`/about/team/${slug}`).then((res) => res.data);

// // ============================================================
// // SITE SETTINGS
// // ============================================================

// // GET /settings
// // Public site settings used by Footer, Contact section, TopInfoBar, etc.
// export const getSiteSettings = () =>
//   api.get("/settings").then((res) => res.data);


// // PUT /settings/admin
// // Admin updates site settings
// export const updateSiteSettings = (payload) =>
//   api.put("/settings/admin", payload).then((res) => res.data);
// //===========================================================================

// // ============================================================
// // PACKAGE BATCHES
// // ============================================================

// // GET /package-batches/upcoming
// // Public → published upcoming batches only
// export const getUpcomingBatches = () =>
//   api
//     .get("/package-batches/upcoming")
//     .then((res) => res.data);


// // GET /package-batches/slug/:slug
// // Public → single batch detail by SEO-friendly slug
// // Example:
// // /package-batches/kerala-backwaters-hills-2026-10-10
// export const getBatchBySlug = (slug) =>
//   api
//     .get(`/package-batches/slug/${encodeURIComponent(slug)}`)
//     .then((res) => res.data);


// // GET /package-batches/package/:package_id
// // Public → all batches belonging to a package
// export const getBatchesByPackage = (packageId) =>
//   api
//     .get(`/package-batches/package/${packageId}`)
//     .then((res) => res.data);