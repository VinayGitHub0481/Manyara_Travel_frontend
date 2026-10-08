




import { useEffect, useMemo, useState } from "react";

import {
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
} from "../../api/adminPackages";

import { getAllMostVisitedAdmin } from "../../api/adminMostVisited";

import {
  getAllSeasonedDestinations,
} from "../../api/adminSeasonedVisit";

import ImageUploadField from "../../components/admin/ImageUploadField";

// =========================================================
// PACKAGE TYPES
// =========================================================

const PACKAGE_TYPES = [
  {
    value: "pilgrimage",
    label: "Pilgrimage",
  },
  {
    value: "mountains_adventure",
    label: "Mountains & Adventure",
  },
  {
    value: "romantic",
    label: "Romantic",
  },
  {
    value: "international",
    label: "International",
  },
  {
    value: "beach",
    label: "Beach",
  },
  {
    value: "family",
    label: "Family",
  },
  {
    value: "wildlife_nature",
    label: "Wildlife & Nature",
  },
];

// =========================================================
// DISCOVERY OPTIONS
// =========================================================

const DISCOVERY_OPTIONS = [
  {
    key: "is_popular",
    label: "Popular",
    description: "Show in Popular Packages",
  },
  {
    key: "is_recommended",
    label: "Recommended",
    description: "Show in Recommended Packages",
  },
  {
    key: "is_trending",
    label: "Trending",
    description: "Show in Trending Packages",
  },
  {
    key: "is_featured",
    label: "Featured",
    description: "Show in Featured Packages",
  },
  {
    key: "is_new",
    label: "New",
    description: "Show in New Packages",
  },
  {
    key: "is_most_visited",
    label: "Most Visited",
    description: "Show in Most Visited Packages",
  },
];

// =========================================================
// EMPTY FORM
// =========================================================

const EMPTY_FORM = {
  title: "",

  // -------------------------------------------------------
  // Destination
  // -------------------------------------------------------
  destination_type: "regular",
  destination: "",
  destination_id: "",
  seasoned_destination_id: "",

  // -------------------------------------------------------
  // Package
  // -------------------------------------------------------
  package_type: "family",
  display_order: 0,
  price: "",
  duration_days: "",
  duration_nights: "",
  description: "",
  status: "draft",

  // -------------------------------------------------------
  // Discovery
  // -------------------------------------------------------
  is_popular: false,
  is_recommended: false,
  is_trending: false,
  is_featured: false,
  is_new: false,
  is_most_visited: false,

  // -------------------------------------------------------
  // Content
  // -------------------------------------------------------
  images: [],
  itinerary: [],
  facilities: [],
  inclusions: [],
  exclusions: [],

  // -------------------------------------------------------
  // Policies
  // -------------------------------------------------------
  terms_and_conditions: "",
  cancellation_policy: "",
};

// =========================================================
// STYLES
// =========================================================

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const SELECT_CLASS =
  "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all focus:border-rose-300 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-surface";

const TEXTAREA_CLASS =
  "w-full min-w-0 resize-none rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-semibold text-ink-800";

const HELP_CLASS =
  "mt-1.5 text-xs leading-relaxed text-ink-500";

// =========================================================
// HELPERS
// =========================================================

function getDestinationName(destination) {
  return (
    destination?.place_name ||
    destination?.name ||
    destination?.title ||
    ""
  );
}

function getImageUrl(image) {
  if (typeof image === "string") {
    return image;
  }

  return image?.url || "";
}

function getApiError(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc
              .filter((part) => part !== "body")
              .join(".")
          : "";

        return field
          ? `${field}: ${item?.msg || "Validation error"}`
          : item?.msg || "Validation error";
      })
      .join("\n");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return error?.message || fallback;
}

// =========================================================
// COMPONENT
// =========================================================

export default function PackagesManage() {
  const [packages, setPackages] = useState([]);

  const [destinations, setDestinations] = useState([]);

  const [seasonedDestinations, setSeasonedDestinations] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [destinationsLoading, setDestinationsLoading] =
    useState(true);

  const [seasonedLoading, setSeasonedLoading] =
    useState(true);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [typeFilter, setTypeFilter] = useState("all");

  // =========================================================
  // LOAD PACKAGES
  // =========================================================

  const load = async () => {
    try {
      setLoading(true);

      const data = await getAllPackagesAdmin();

      setPackages(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error("Failed to load packages:", err);

      setError(
        getApiError(
          err,
          "Could not load packages."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================================================
  // LOAD MOST VISITED DESTINATIONS
  // =========================================================

  const loadDestinations = async () => {
    try {
      setDestinationsLoading(true);

      const data = await getAllMostVisitedAdmin();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setDestinations(items);
    } catch (err) {
      console.error(
        "Failed to load destinations:",
        err
      );

      setDestinations([]);

      setError(
        getApiError(
          err,
          "Could not load Most Visited destinations."
        )
      );
    } finally {
      setDestinationsLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  // =========================================================
  // LOAD SEASONAL DESTINATIONS
  // =========================================================

  const loadSeasonedDestinations = async () => {
    try {
      setSeasonedLoading(true);

      const data =
        await getAllSeasonedDestinations();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setSeasonedDestinations(items);
    } catch (err) {
      console.error(
        "Failed to load seasonal destinations:",
        err
      );

      setSeasonedDestinations([]);

      // Seasonal destinations are optional.
      // Package management can still continue.
    } finally {
      setSeasonedLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonedDestinations();
  }, []);

  // =========================================================
  // FORM HELPERS
  // =========================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleDiscovery = (field) => {
    setForm((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  // =========================================================
  // DESTINATION TYPE
  // =========================================================

  const handleDestinationTypeChange = (type) => {
    setForm((current) => ({
      ...current,
      destination_type: type,

      // When switching to regular:
      // clear seasonal destination.
      destination_id:
        type === "regular"
          ? current.destination_id
          : "",

      seasoned_destination_id:
        type === "seasonal"
          ? current.seasoned_destination_id
          : "",

      destination:
        type === "seasonal"
          ? ""
          : current.destination,
    }));

    setError("");
  };

  const handleRegularDestinationChange = (
    selectedValue
  ) => {
    const selectedId = Number(selectedValue);

    const selected =
      destinations.find(
        (destination) =>
          Number(destination?.id) === selectedId
      );

    setForm((current) => ({
      ...current,
      destination_type: "regular",
      destination_id:
        selectedId || "",
      seasoned_destination_id: "",
      destination:
        getDestinationName(selected),
    }));
  };

  const handleSeasonalDestinationChange = (
    selectedValue
  ) => {
    setForm((current) => ({
      ...current,
      destination_type: "seasonal",
      destination_id: "",
      seasoned_destination_id:
        selectedValue || "",
      destination: "",
    }));
  };

  // =========================================================
  // FILTERED PACKAGES
  // =========================================================

  const filteredPackages = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return packages.filter((pkg) => {
      const seasonalName =
        pkg?.seasoned_destination_obj
          ? getDestinationName(
              pkg.seasoned_destination_obj
            )
          : "";

      const destinationText =
        pkg?.destination ||
        seasonalName ||
        "";

      const matchesSearch =
        !normalizedSearch ||
        String(pkg?.title || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        destinationText
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        pkg?.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        pkg?.package_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    packages,
    search,
    statusFilter,
    typeFilter,
  ]);

  // =========================================================
  // OPEN CREATE
  // =========================================================

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      images: [],
      itinerary: [],
      facilities: [],
      inclusions: [],
      exclusions: [],
    });

    setError("");

    setEditing({});
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEdit = (pkg) => {
    const seasonalId =
      pkg?.seasoned_destination_id ??
      pkg?.seasoned_destination_obj?.id ??
      "";

    const regularId =
      pkg?.destination_id ??
      pkg?.destination_obj?.id ??
      "";

    const isSeasonal =
      Boolean(seasonalId) &&
      !Boolean(regularId);

    setForm({
      title: pkg?.title || "",

      destination_type: isSeasonal
        ? "seasonal"
        : "regular",

      destination:
        isSeasonal
          ? ""
          : pkg?.destination || "",

      destination_id:
        isSeasonal
          ? ""
          : regularId,

      seasoned_destination_id:
        isSeasonal
          ? seasonalId
          : "",

      package_type:
        pkg?.package_type || "family",

      display_order:
        pkg?.display_order ?? 0,

      price:
        pkg?.price ?? "",

      duration_days:
        pkg?.duration_days ?? "",

      duration_nights:
        pkg?.duration_nights ??
        (
          (Number(pkg?.duration_days) || 0) > 0
            ? Math.max(
                Number(pkg.duration_days) - 1,
                0
              )
            : ""
        ),

      description:
        pkg?.description || "",

      status:
        pkg?.status || "draft",

      is_popular:
        Boolean(pkg?.is_popular),

      is_recommended:
        Boolean(pkg?.is_recommended),

      is_trending:
        Boolean(pkg?.is_trending),

      is_featured:
        Boolean(pkg?.is_featured),

      is_new:
        Boolean(pkg?.is_new),

      is_most_visited:
        Boolean(pkg?.is_most_visited),

      images:
        Array.isArray(pkg?.images)
          ? pkg.images
          : [],

      itinerary:
        Array.isArray(pkg?.itinerary)
          ? pkg.itinerary.map(
              (item, index) => ({
                day: index + 1,
                title:
                  item?.title || "",
                description:
                  item?.description || "",
                image:
                  getImageUrl(
                    item?.image
                  ) || null,
              })
            )
          : [],

      facilities:
        Array.isArray(pkg?.facilities)
          ? pkg.facilities
          : [],

      inclusions:
        Array.isArray(pkg?.inclusions)
          ? pkg.inclusions
          : [],

      exclusions:
        Array.isArray(pkg?.exclusions)
          ? pkg.exclusions
          : [],

      terms_and_conditions:
        pkg?.terms_and_conditions || "",

      cancellation_policy:
        pkg?.cancellation_policy || "",
    });

    setError("");

    setEditing(pkg);
  };

  // =========================================================
  // RESOLVE LEGACY NORMAL DESTINATION
  // =========================================================
  //
  // Only applies to old normal packages that have a
  // destination name but no destination_id.
  //
  // Never applies to seasonal packages.
  // =========================================================

  useEffect(() => {
    if (
      form.destination_type !== "regular" ||
      form.destination_id ||
      !form.destination ||
      destinations.length === 0
    ) {
      return;
    }

    const normalized =
      form.destination
        .trim()
        .toLowerCase();

    const match =
      destinations.find(
        (destination) => {
          const name =
            getDestinationName(
              destination
            );

          return (
            name
              .trim()
              .toLowerCase() ===
            normalized
          );
        }
      );

    if (match?.id) {
      setForm((current) => ({
        ...current,
        destination_type: "regular",
        destination_id:
          Number(match.id),
        seasoned_destination_id: "",
        destination:
          getDestinationName(match) ||
          current.destination,
      }));
    }
  }, [
    destinations,
    form.destination,
    form.destination_id,
    form.destination_type,
  ]);

  // =========================================================
  // ITINERARY
  // =========================================================

  const addItineraryDay = () => {
    setForm((current) => ({
      ...current,

      itinerary: [
        ...current.itinerary,

        {
          day:
            current.itinerary.length + 1,
          title: "",
          description: "",
          image: null,
        },
      ],
    }));
  };

  const updateItineraryDay = (
    index,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        ),
    }));
  };

  const removeItineraryDay = (
    index
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary
          .filter(
            (_, i) => i !== index
          )
          .map((item, i) => ({
            ...item,
            day: i + 1,
          })),
    }));
  };

  const addItineraryImage = (
    index,
    img
  ) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  image: img.url,
                }
              : item
        ),
    }));
  };

  const removeItineraryImage = (
    index
  ) => {
    setForm((current) => ({
      ...current,

      itinerary:
        current.itinerary.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  image: null,
                }
              : item
        ),
    }));
  };

  // =========================================================
  // PACKAGE IMAGES
  // =========================================================

  const addImage = (img) => {
    if (!img?.url) return;

    setForm((current) => ({
      ...current,

      images: [
        ...current.images,
        img,
      ],
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,

      images:
        current.images.filter(
          (_, i) => i !== index
        ),
    }));
  };

  // =========================================================
  // LIST FIELDS
  // =========================================================

  const addListItem = (field) => {
    setForm((current) => ({
      ...current,

      [field]: [
        ...current[field],
        "",
      ],
    }));
  };

  const updateListItem = (
    field,
    index,
    value
  ) => {
    setForm((current) => ({
      ...current,

      [field]:
        current[field].map(
          (item, i) =>
            i === index
              ? value
              : item
        ),
    }));
  };

  const removeListItem = (
    field,
    index
  ) => {
    setForm((current) => ({
      ...current,

      [field]:
        current[field].filter(
          (_, i) => i !== index
        ),
    }));
  };

  // =========================================================
  // SAVE PACKAGE
  // =========================================================

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      // -----------------------------------------------------
      // BASIC VALIDATION
      // -----------------------------------------------------

      if (!form.title.trim()) {
        setError(
          "Package title is required."
        );
        return;
      }

      // -----------------------------------------------------
      // DESTINATION VALIDATION
      // -----------------------------------------------------

      if (
        form.destination_type !==
          "regular" &&
        form.destination_type !==
          "seasonal"
      ) {
        setError(
          "Please select a destination type."
        );
        return;
      }

      if (
        form.destination_type ===
          "regular" &&
        !Number(form.destination_id)
      ) {
        setError(
          "Please select a regular destination."
        );
        return;
      }

      if (
        form.destination_type ===
          "seasonal" &&
        !Number(
          form.seasoned_destination_id
        )
      ) {
        setError(
          "Please select a seasonal destination."
        );
        return;
      }

      // -----------------------------------------------------
      // PRICE
      // -----------------------------------------------------

      if (
        !Number(form.price) ||
        Number(form.price) <= 0
      ) {
        setError(
          "Price must be greater than 0."
        );
        return;
      }

      // -----------------------------------------------------
      // DURATION
      // -----------------------------------------------------

      if (
        !Number(form.duration_days) ||
        Number(form.duration_days) < 1
      ) {
        setError(
          "Duration (days) must be at least 1."
        );
        return;
      }

      // -----------------------------------------------------
      // DESTINATION IDS
      // -----------------------------------------------------

      const normalDestinationId =
        form.destination_type ===
        "regular"
          ? Number(
              form.destination_id
            )
          : null;

      const seasonalDestinationId =
        form.destination_type ===
        "seasonal"
          ? Number(
              form.seasoned_destination_id
            )
          : null;

      // -----------------------------------------------------
      // PAYLOAD
      // -----------------------------------------------------

      const payload = {
        // ===================================================
        // BASIC
        // ===================================================

        title:
          form.title.trim(),

        // IMPORTANT:
        //
        // We intentionally DO NOT send `destination`.
        //
        // Backend service derives it from the selected
        // normal destination.
        //
        // Seasonal packages get destination = NULL.

        destination_id:
          normalDestinationId,

        seasoned_destination_id:
          seasonalDestinationId,

        package_type:
          form.package_type,

        display_order:
          Number(
            form.display_order
          ) || 0,

        price:
          Number(form.price),

        duration_days:
          Number(
            form.duration_days
          ),

        duration_nights:
          Number(
            form.duration_nights ||
              Math.max(
                Number(
                  form.duration_days
                ) - 1,
                0
              )
          ),

        description:
          form.description.trim() ||
          null,

        status:
          form.status,

        // ===================================================
        // DISCOVERY
        // ===================================================

        is_popular:
          Boolean(
            form.is_popular
          ),

        is_recommended:
          Boolean(
            form.is_recommended
          ),

        is_trending:
          Boolean(
            form.is_trending
          ),

        is_featured:
          Boolean(
            form.is_featured
          ),

        is_new:
          Boolean(
            form.is_new
          ),

        is_most_visited:
          Boolean(
            form.is_most_visited
          ),

        // ===================================================
        // IMAGES
        // ===================================================

        images:
          form.images
            .filter(
              (img) =>
                Boolean(img?.url)
            )
            .map((img) => ({
              url: img.url,

              ...(img?.public_id
                ? {
                    public_id:
                      img.public_id,
                  }
                : {}),
            })),

        // ===================================================
        // ITINERARY
        // ===================================================

        itinerary:
          form.itinerary.map(
            (item, index) => ({
              day: index + 1,

              title:
                item?.title?.trim() ||
                "",

              description:
                item?.description?.trim() ||
                "",

              image:
                item?.image || null,
            })
          ),

        // ===================================================
        // FACILITIES
        // ===================================================

        facilities:
          form.facilities
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // INCLUSIONS
        // ===================================================

        inclusions:
          form.inclusions
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // EXCLUSIONS
        // ===================================================

        exclusions:
          form.exclusions
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        // ===================================================
        // POLICIES
        // ===================================================

        terms_and_conditions:
          form.terms_and_conditions.trim() ||
          null,

        cancellation_policy:
          form.cancellation_policy.trim() ||
          null,
      };

      console.log(
        "Saving package:",
        payload
      );

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editing?.id) {
        await updatePackage(
          editing.id,
          payload
        );
      }

      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {
        await createPackage(
          payload
        );
      }

      setEditing(null);

      setForm({
        ...EMPTY_FORM,
        images: [],
        itinerary: [],
        facilities: [],
        inclusions: [],
        exclusions: [],
      });

      await load();
    } catch (err) {
      console.error(
        "Package save failed:",
        err
      );

      setError(
        getApiError(
          err,
          "Failed to save package."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    id
  ) => {
    if (
      !window.confirm(
        "Delete this package? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deletePackage(id);

      await load();
    } catch (err) {
      console.error(
        "Package delete failed:",
        err
      );

      setError(
        getApiError(
          err,
          "Could not delete package."
        )
      );
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setEditing(null);

    setForm({
      ...EMPTY_FORM,
      images: [],
      itinerary: [],
      facilities: [],
      inclusions: [],
      exclusions: [],
    });

    setError("");
  };

  // =========================================================
  // DISCOVERY LABELS
  // =========================================================

  const getDiscoveryLabels = (
    pkg
  ) =>
    DISCOVERY_OPTIONS.filter(
      (option) =>
        Boolean(
          pkg?.[option.key]
        )
    );

  // =========================================================
  // DESTINATION DISPLAY
  // =========================================================

  const getPackageDestinationName = (
    pkg
  ) => {
    if (
      pkg?.seasoned_destination_obj
    ) {
      return getDestinationName(
        pkg.seasoned_destination_obj
      );
    }

    if (
      pkg?.seasoned_destination
    ) {
      return getDestinationName(
        pkg.seasoned_destination
      );
    }

    if (pkg?.destination) {
      return pkg.destination;
    }

    return "—";
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-background p-3 sm:p-5 md:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-rose-500" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Manyara Prive Vacations
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
            Packages
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500">
            Create and manage travel packages,
            destinations, visibility sections,
            itineraries and package policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-travel-hover focus:outline-none focus:ring-4 focus:ring-rose-100 sm:w-auto"
        >
          <span className="text-lg leading-none transition-transform duration-200 group-hover:rotate-90">
            +
          </span>

          New Package
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !editing && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text shadow-travel-card">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
            !
          </span>

          <p className="whitespace-pre-line leading-6">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Total Packages
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
            {packages.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Published
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
            {
              packages.filter(
                (pkg) =>
                  pkg.status ===
                  "published"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Drafts
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
            {
              packages.filter(
                (pkg) =>
                  pkg.status ===
                  "draft"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Featured
          </p>

          <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
            {
              packages.filter(
                (pkg) =>
                  Boolean(
                    pkg.is_featured
                  )
              ).length
            }
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ====================================================== */}

      <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-travel-card sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search package or destination..."
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className={SELECT_CLASS}
          >
            <option value="all">
              All Statuses
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className={SELECT_CLASS}
          >
            <option value="all">
              All Package Types
            </option>

            {PACKAGE_TYPES.map(
              (type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs text-ink-500">
            Showing{" "}
            <span className="font-bold text-ink-700">
              {filteredPackages.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-ink-700">
              {packages.length}
            </span>{" "}
            packages
          </p>

          {(search ||
            statusFilter !==
              "all" ||
            typeFilter !==
              "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "all"
                );
                setTypeFilter(
                  "all"
                );
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          PACKAGE TABLE
      ====================================================== */}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-travel-card">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-rose-100 border-t-rose-600" />

          <p className="text-sm font-medium text-ink-500">
            Loading packages...
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card">
          <div className="border-b border-border bg-surface-alt px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-800">
                  Package Catalogue
                </h2>

                <p className="text-xs text-ink-500">
                  Manage package content and website visibility.
                </p>
              </div>

              <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                {filteredPackages.length}{" "}
                package
                {filteredPackages.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-[0.12em] text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 text-left font-bold">
                    Package
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Destination
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Type
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Price
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Visibility
                  </th>

                  <th className="px-5 py-3.5 text-left font-bold">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map(
                  (pkg) => {
                    const labels =
                      getDiscoveryLabels(
                        pkg
                      );

                    const isSeasonal =
                      Boolean(
                        pkg?.seasoned_destination_id
                      );

                    return (
                      <tr
                        key={pkg.id}
                        className="border-t border-border transition-colors hover:bg-surface-alt"
                      >
                        {/* PACKAGE */}

                        <td className="px-5 py-4">
                          <div className="flex max-w-[280px] items-center gap-3">
                            {getImageUrl(
                              pkg?.images?.[0]
                            ) ? (
                              <img
                                src={getImageUrl(
                                  pkg?.images?.[0]
                                )}
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg text-rose-600">
                                ✦
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink-800">
                                {pkg.title}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-ink-500">
                                {pkg.duration_days}{" "}
                                days{" "}
                                {pkg.duration_nights ??
                                  0}{" "}
                                nights
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* DESTINATION */}

                        <td className="px-5 py-4">
                          <span className="text-ink-700">
                            {getPackageDestinationName(
                              pkg
                            )}
                          </span>

                          <span
                            className={`mt-1 block text-[11px] font-semibold ${
                              isSeasonal
                                ? "text-rose-600"
                                : "text-ink-400"
                            }`}
                          >
                            {isSeasonal
                              ? "Seasonal destination"
                              : "Regular destination"}
                          </span>
                        </td>

                        {/* PACKAGE TYPE */}

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                            {PACKAGE_TYPES.find(
                              (type) =>
                                type.value ===
                                pkg.package_type
                            )?.label ||
                              pkg.package_type ||
                              "Family"}
                          </span>
                        </td>

                        {/* PRICE */}

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-semibold text-ink-800">
                            ₹
                            {Number(
                              pkg.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>

                          <span className="block text-[11px] text-ink-400">
                            starting price
                          </span>
                        </td>

                        {/* VISIBILITY */}

                        <td className="px-5 py-4">
                          <div className="flex max-w-[260px] flex-wrap gap-1.5">
                            {labels.length >
                            0 ? (
                              labels.map(
                                (
                                  option
                                ) => (
                                  <span
                                    key={
                                      option.key
                                    }
                                    className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
                                  >
                                    {
                                      option.label
                                    }
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-xs text-ink-400">
                                No labels
                              </span>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              pkg.status ===
                              "published"
                                ? "bg-success-bg text-success-text"
                                : "bg-surface-strong text-ink-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                pkg.status ===
                                "published"
                                  ? "bg-success"
                                  : "bg-ink-400"
                              }`}
                            />

                            {pkg.status ===
                            "published"
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  pkg
                                )
                              }
                              className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  pkg.id
                                )
                              }
                              className="rounded-lg border border-error/15 bg-error-bg px-3 py-1.5 text-xs font-bold text-error-text transition-colors hover:border-error/25"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}

                {filteredPackages.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl text-rose-600">
                          ✦
                        </div>

                        <p className="font-display text-lg font-semibold text-ink-800">
                          No packages found
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-500">
                          Try changing
                          your filters
                          or create a
                          new travel
                          package.
                        </p>

                        {!search &&
                          statusFilter ===
                            "all" &&
                          typeFilter ===
                            "all" && (
                            <button
                              type="button"
                              onClick={
                                openCreate
                              }
                              className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-brand transition-colors hover:bg-rose-700"
                            >
                              Create First
                              Package
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">
            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-rose-500" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
                      Package Manager
                    </span>
                  </div>

                  <h2 className="font-display text-2xl font-semibold text-ink-800">
                    {editing?.id
                      ? "Edit Package"
                      : "Create New Package"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-ink-500 sm:text-sm">
                    Manage package content,
                    destinations, itinerary,
                    images and website visibility.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={
                handleSave
              }
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="space-y-7 p-4 sm:p-6 lg:p-8">
                {/* =================================================
                    BASIC DETAILS
                ================================================== */}

                <section className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-5">
                  <div className="mb-5">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Basic Details
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Define the main package information,
                      pricing and destination.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* TITLE */}

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="package-title"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Package Title
                      </label>

                      <input
                        id="package-title"
                        required
                        value={
                          form.title
                        }
                        onChange={(e) =>
                          updateField(
                            "title",
                            e.target.value
                          )
                        }
                        placeholder="Example: Kerala 5 Days Premium Package"
                        className={
                          INPUT_CLASS
                        }
                      />
                    </div>

                    {/* =================================================
                        DESTINATION TYPE
                    ================================================== */}

                    <div className="sm:col-span-2">
                      <label
                        className={
                          LABEL_CLASS
                        }
                      >
                        Destination Type
                        <span className="ml-1 text-rose-600">
                          *
                        </span>
                      </label>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* REGULAR */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDestinationTypeChange(
                              "regular"
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            form.destination_type ===
                            "regular"
                              ? "border-rose-300 bg-rose-50 shadow-travel-card"
                              : "border-border bg-white hover:border-rose-200 hover:bg-rose-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                form.destination_type ===
                                "regular"
                                  ? "border-rose-600 bg-rose-600"
                                  : "border-border bg-white"
                              }`}
                            >
                              {form.destination_type ===
                                "regular" && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </span>

                            <span>
                              <span className="block text-sm font-bold text-ink-800">
                                Regular Destination
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-ink-500">
                                Use a normal destination
                                from Most Visited.
                              </span>
                            </span>
                          </div>
                        </button>

                        {/* SEASONAL */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDestinationTypeChange(
                              "seasonal"
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            form.destination_type ===
                            "seasonal"
                              ? "border-rose-300 bg-rose-50 shadow-travel-card"
                              : "border-border bg-white hover:border-rose-200 hover:bg-rose-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                form.destination_type ===
                                "seasonal"
                                  ? "border-rose-600 bg-rose-600"
                                  : "border-border bg-white"
                              }`}
                            >
                              {form.destination_type ===
                                "seasonal" && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </span>

                            <span>
                              <span className="block text-sm font-bold text-ink-800">
                                Seasonal Destination
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-ink-500">
                                Use a destination
                                available for a
                                specific season.
                              </span>
                            </span>
                          </div>
                        </button>
                      </div>

                      <p className={HELP_CLASS}>
                        A package belongs to
                        exactly one destination
                        type.
                      </p>
                    </div>

                    {/* =================================================
                        REGULAR DESTINATION
                    ================================================== */}

                    {form.destination_type ===
                      "regular" && (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="package-destination"
                          className={
                            LABEL_CLASS
                          }
                        >
                          Regular Destination
                          <span className="ml-1 text-rose-600">
                            *
                          </span>
                        </label>

                        <select
                          id="package-destination"
                          required
                          value={
                            form.destination_id
                          }
                          disabled={
                            destinationsLoading
                          }
                          onChange={(e) =>
                            handleRegularDestinationChange(
                              e.target.value
                            )
                          }
                          className={
                            SELECT_CLASS
                          }
                        >
                          <option value="">
                            {destinationsLoading
                              ? "Loading destinations..."
                              : "Select destination"}
                          </option>

                          {destinations.map(
                            (
                              destination
                            ) => (
                              <option
                                key={
                                  destination.id
                                }
                                value={
                                  destination.id
                                }
                              >
                                {getDestinationName(
                                  destination
                                )}
                              </option>
                            )
                          )}
                        </select>

                        <p className={HELP_CLASS}>
                          Select the normal
                          destination from
                          Most Visited.
                        </p>
                      </div>
                    )}

                    {/* =================================================
                        SEASONAL DESTINATION
                    ================================================== */}

                    {form.destination_type ===
                      "seasonal" && (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="seasonal-destination"
                          className={
                            LABEL_CLASS
                          }
                        >
                          Seasonal Destination
                          <span className="ml-1 text-rose-600">
                            *
                          </span>
                        </label>

                        <select
                          id="seasonal-destination"
                          required
                          value={
                            form.seasoned_destination_id
                          }
                          disabled={
                            seasonedLoading
                          }
                          onChange={(e) =>
                            handleSeasonalDestinationChange(
                              e.target.value
                            )
                          }
                          className={
                            SELECT_CLASS
                          }
                        >
                          <option value="">
                            {seasonedLoading
                              ? "Loading seasonal destinations..."
                              : "Select seasonal destination"}
                          </option>

                          {seasonedDestinations
                            .filter(
                              (
                                destination
                              ) =>
                                destination?.status ===
                                  undefined ||
                                destination?.status ===
                                  "published"
                            )
                            .map(
                              (
                                destination
                              ) => (
                                <option
                                  key={
                                    destination.id
                                  }
                                  value={
                                    destination.id
                                  }
                                >
                                  {getDestinationName(
                                    destination
                                  )}
                                </option>
                              )
                            )}
                        </select>

                        <p className={HELP_CLASS}>
                          This package will be
                          associated only with
                          the selected seasonal
                          destination.
                        </p>
                      </div>
                    )}

                    {/* PACKAGE TYPE */}

                    <div>
                      <label
                        htmlFor="package-type"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Package Type
                      </label>

                      <select
                        id="package-type"
                        value={
                          form.package_type
                        }
                        onChange={(e) =>
                          updateField(
                            "package_type",
                            e.target.value
                          )
                        }
                        className={
                          SELECT_CLASS
                        }
                      >
                        {PACKAGE_TYPES.map(
                          (type) => (
                            <option
                              key={
                                type.value
                              }
                              value={
                                type.value
                              }
                            >
                              {
                                type.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* STATUS */}

                    <div>
                      <label
                        htmlFor="package-status"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Publishing Status
                      </label>

                      <select
                        id="package-status"
                        value={
                          form.status
                        }
                        onChange={(e) =>
                          updateField(
                            "status",
                            e.target.value
                          )
                        }
                        className={
                          SELECT_CLASS
                        }
                      >
                        <option value="draft">
                          Draft
                        </option>

                        <option value="published">
                          Published
                        </option>
                      </select>
                    </div>

                    {/* PRICE */}

                    <div>
                      <label
                        htmlFor="package-price"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Starting Price (₹)
                      </label>

                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-500">
                          ₹
                        </span>

                        <input
                          id="package-price"
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={
                            form.price
                          }
                          onChange={(e) =>
                            updateField(
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="25000"
                          className={`${INPUT_CLASS} pl-8`}
                        />
                      </div>
                    </div>

                    {/* DISPLAY ORDER */}

                    <div>
                      <label
                        htmlFor="package-order"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Display Order
                      </label>

                      <input
                        id="package-order"
                        type="number"
                        min="0"
                        value={
                          form.display_order
                        }
                        onChange={(e) =>
                          updateField(
                            "display_order",
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className={
                          INPUT_CLASS
                        }
                      />

                      <p className={HELP_CLASS}>
                        Lower numbers
                        appear first.
                      </p>
                    </div>

                    {/* DAYS */}

                    <div>
                      <label
                        htmlFor="package-days"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Duration — Days
                      </label>

                      <input
                        id="package-days"
                        type="number"
                        required
                        min="1"
                        value={
                          form.duration_days
                        }
                        onChange={(e) =>
                          updateField(
                            "duration_days",
                            e.target.value
                          )
                        }
                        placeholder="5"
                        className={
                          INPUT_CLASS
                        }
                      />
                    </div>

                    {/* NIGHTS */}

                    <div>
                      <label
                        htmlFor="package-nights"
                        className={
                          LABEL_CLASS
                        }
                      >
                        Duration — Nights
                      </label>

                      <input
                        id="package-nights"
                        type="number"
                        required
                        min="0"
                        value={
                          form.duration_nights
                        }
                        onChange={(e) =>
                          updateField(
                            "duration_nights",
                            e.target.value
                          )
                        }
                        placeholder="4"
                        className={
                          INPUT_CLASS
                        }
                      />

                      <p className={HELP_CLASS}>
                        Usually days minus
                        one. Example: 5 days
                        = 4 nights.
                      </p>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    DISCOVERY / VISIBILITY
                ================================================== */}

                <section className="rounded-2xl border border-rose-100 bg-brand-gradient p-4 sm:p-5">
                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                        ✦
                      </span>

                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink-800">
                          Website Visibility
                        </h3>

                        <p className="text-xs text-ink-500">
                          Choose where this
                          package should appear.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DISCOVERY_OPTIONS.map(
                      (option) => {
                        const checked =
                          Boolean(
                            form[
                              option.key
                            ]
                          );

                        return (
                          <label
                            key={
                              option.key
                            }
                            className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                              checked
                                ? "border-rose-200 bg-white shadow-travel-card"
                                : "border-border/70 bg-white/70 hover:border-rose-100 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                checked
                                  ? "border-rose-600 bg-rose-600 text-white"
                                  : "border-border bg-white text-transparent"
                              }`}
                            >
                              {checked &&
                                "✓"}
                            </span>

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleDiscovery(
                                  option.key
                                )
                              }
                              className="sr-only"
                            />

                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-ink-800">
                                {
                                  option.label
                                }
                              </span>

                              <span className="mt-0.5 block text-xs leading-5 text-ink-500">
                                {
                                  option.description
                                }
                              </span>
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                      Current discovery labels
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {DISCOVERY_OPTIONS.filter(
                        (option) =>
                          form[
                            option.key
                          ]
                      ).map(
                        (option) => (
                          <span
                            key={
                              option.key
                            }
                            className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100"
                          >
                            {
                              option.label
                            }
                          </span>
                        )
                      )}

                      {DISCOVERY_OPTIONS.every(
                        (option) =>
                          !form[
                            option.key
                          ]
                      ) && (
                        <span className="text-xs text-ink-400">
                          No discovery
                          sections
                          selected.
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* =================================================
                    DESCRIPTION
                ================================================== */}

                <section>
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Package Description
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Give travellers a clear
                      overview of the experience.
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Describe the destination, experience, highlights and what makes this package special..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    ITINERARY
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Day-by-Day Itinerary
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-ink-500">
                        Add activities,
                        descriptions and a
                        dedicated image for
                        each day.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        addItineraryDay
                      }
                      className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 sm:w-auto"
                    >
                      + Add Day
                    </button>
                  </div>

                  {form.itinerary.length ===
                    0 && (
                    <div className="rounded-2xl border border-dashed border-rose-200 bg-brand-gradient p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-rose-600 shadow-sm">
                        ✦
                      </div>

                      <p className="font-semibold text-ink-700">
                        No itinerary days
                        yet
                      </p>

                      <p className="mt-1 text-xs text-ink-500">
                        Click “Add Day” to
                        create Day 1.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {form.itinerary.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card"
                        >
                          {/* DAY HEADER */}

                          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3.5 sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-ink-800">
                                  Day{" "}
                                  {index +
                                    1}
                                </p>

                                <p className="truncate text-xs text-ink-500">
                                  Day{" "}
                                  {index +
                                    1}{" "}
                                  itinerary
                                  details
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItineraryDay(
                                  index
                                )
                              }
                              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-text transition-colors hover:bg-error-bg"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="p-4 sm:p-5">
                            {/* DAY TITLE */}

                            <div className="mb-4">
                              <label
                                className={
                                  LABEL_CLASS
                                }
                              >
                                Day{" "}
                                {index +
                                  1}{" "}
                                Title
                              </label>

                              <input
                                required
                                value={
                                  item?.title ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItineraryDay(
                                    index,
                                    "title",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Example: Arrival in Kochi & Local Sightseeing"
                                className={
                                  INPUT_CLASS
                                }
                              />
                            </div>

                            {/* DAY DESCRIPTION */}

                            <div className="mb-5">
                              <label
                                className={
                                  LABEL_CLASS
                                }
                              >
                                Day{" "}
                                {index +
                                  1}{" "}
                                Description
                              </label>

                              <textarea
                                required
                                rows={4}
                                value={
                                  item?.description ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItineraryDay(
                                    index,
                                    "description",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Describe activities, sightseeing, meals, transfers and experiences for this day..."
                                className={
                                  TEXTAREA_CLASS
                                }
                              />
                            </div>

                            {/* DAY IMAGE */}

                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <label className="text-sm font-bold text-ink-800">
                                  Day{" "}
                                  {index +
                                    1}{" "}
                                  Image
                                </label>

                                {item?.image && (
                                  <span className="rounded-full bg-success-bg px-2.5 py-1 text-[10px] font-bold text-success-text">
                                    Image added
                                  </span>
                                )}
                              </div>

                              {item?.image ? (
                                <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-surface sm:h-60">
                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item?.title ||
                                      `Day ${
                                        index +
                                        1
                                      }`
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent p-4">
                                    <p className="text-xs font-bold text-white">
                                      Day{" "}
                                      {index +
                                        1}
                                    </p>

                                    {item?.title && (
                                      <p className="mt-0.5 truncate text-sm font-semibold text-white">
                                        {
                                          item.title
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItineraryImage(
                                        index
                                      )
                                    }
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
                                    aria-label={`Remove Day ${
                                      index +
                                      1
                                    } image`}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-surface-alt p-2">
                                  <ImageUploadField
                                    value={
                                      null
                                    }
                                    onChange={(
                                      img
                                    ) =>
                                      addItineraryImage(
                                        index,
                                        img
                                      )
                                    }
                                    label=""
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {form.itinerary.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        addItineraryDay
                      }
                      className="mt-4 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      + Add Day{" "}
                      {form.itinerary
                        .length + 1}
                    </button>
                  )}
                </section>

                {/* =================================================
                    PACKAGE IMAGES
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Package Images
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Add the main images used
                      across package cards and
                      the package detail page.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {form.images.map(
                      (
                        img,
                        index
                      ) => (
                        <div
                          key={index}
                          className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-travel-card"
                        >
                          <img
                            src={img?.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                index
                              )
                            }
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
                          >
                            ×
                          </button>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/60 to-transparent px-2 pb-2 pt-5 text-[10px] font-bold text-white">
                            Image{" "}
                            {index +
                              1}
                          </div>
                        </div>
                      )
                    )}

                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-1">
                      <ImageUploadField
                        value={null}
                        onChange={
                          addImage
                        }
                        label=""
                      />
                    </div>
                  </div>
                </section>

                {/* =================================================
                    FACILITIES
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Facilities
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        Hotel, breakfast,
                        transport, AC,
                        guide, etc.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "facilities"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.facilities.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "facilities",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: Breakfast included"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "facilities",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove facility"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.facilities.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No facilities
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    INCLUSIONS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Inclusions
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        What is included in
                        the package?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "inclusions"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.inclusions.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "inclusions",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: 4 nights hotel accommodation"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "inclusions",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove inclusion"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.inclusions.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No inclusions
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    EXCLUSIONS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-800">
                        Exclusions
                      </h3>

                      <p className="mt-1 text-xs text-ink-500">
                        What is not included?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        addListItem(
                          "exclusions"
                        )
                      }
                      className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.exclusions.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-2"
                        >
                          <input
                            value={item}
                            onChange={(
                              e
                            ) =>
                              updateListItem(
                                "exclusions",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Example: Flight tickets"
                            className={
                              INPUT_CLASS
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(
                                "exclusions",
                                index
                              )
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
                            aria-label="Remove exclusion"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}

                    {form.exclusions.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
                        No exclusions
                        added.
                      </div>
                    )}
                  </div>
                </section>

                {/* =================================================
                    TERMS
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Terms & Conditions
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Package-specific terms
                      shown to travellers.
                    </p>
                  </div>

                  <textarea
                    rows={7}
                    value={
                      form.terms_and_conditions
                    }
                    onChange={(e) =>
                      updateField(
                        "terms_and_conditions",
                        e.target.value
                      )
                    }
                    placeholder="Enter package terms and conditions..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    CANCELLATION
                ================================================== */}

                <section className="border-t border-border pt-7">
                  <div className="mb-3">
                    <h3 className="font-display text-xl font-semibold text-ink-800">
                      Cancellation Policy
                    </h3>

                    <p className="mt-1 text-xs text-ink-500">
                      Explain cancellation and
                      refund rules for this package.
                    </p>
                  </div>

                  <textarea
                    rows={7}
                    value={
                      form.cancellation_policy
                    }
                    onChange={(e) =>
                      updateField(
                        "cancellation_policy",
                        e.target.value
                      )
                    }
                    placeholder="Enter cancellation policy..."
                    className={
                      TEXTAREA_CLASS
                    }
                  />
                </section>

                {/* =================================================
                    ERROR
                ================================================== */}

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
                      !
                    </span>

                    <p className="whitespace-pre-line leading-6">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  FOOTER ACTIONS
              ================================================== */}

              <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-600 transition-colors hover:bg-surface disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {saving
                      ? "Saving..."
                      : editing?.id
                      ? "Update Package"
                      : "Save Package"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



























































//----------------------------------------------------------------
// import { useEffect, useMemo, useState } from "react";
// import {
//   getAllPackagesAdmin,
//   createPackage,
//   updatePackage,
//   deletePackage,
// } from "../../api/adminPackages";


// import {
//   getAllMostVisitedAdmin,
// } from "../../api/adminMostVisited";

// import {
//   getAllSeasonedDestinations,
// } from "../../api/adminSeasonedVisit";

// import ImageUploadField from "../../components/admin/ImageUploadField";


// const PACKAGE_TYPES = [
//   {
//     value: "pilgrimage",
//     label: "Pilgrimage",
//   },
//   {
//     value: "mountains_adventure",
//     label: "Mountains & Adventure",
//   },
//   {
//     value: "romantic",
//     label: "Romantic",
//   },
//   {
//     value: "international",
//     label: "International",
//   },
//   {
//     value: "beach",
//     label: "Beach",
//   },
//   {
//     value: "family",
//     label: "Family",
//   },
//   {
//     value: "wildlife_nature",
//     label: "Wildlife & Nature",
//   },
// ];

// const DISCOVERY_OPTIONS = [
//   {
//     key: "is_popular",
//     label: "Popular",
//     description: "Show in Popular Packages",
//   },
//   {
//     key: "is_recommended",
//     label: "Recommended",
//     description: "Show in Recommended Packages",
//   },
//   {
//     key: "is_trending",
//     label: "Trending",
//     description: "Show in Trending Packages",
//   },
//   {
//     key: "is_featured",
//     label: "Featured",
//     description: "Show in Featured Packages",
//   },
//   {
//     key: "is_new",
//     label: "New",
//     description: "Show in New Packages",
//   },
//   {
//     key: "is_most_visited",
//     label: "Most Visited",
//     description: "Show in Most Visited Packages",
//   },
// ];

// const EMPTY_FORM = {
//   title: "",
//   destination: "",
//   destination_id: "",
//   seasoned_destination_id: "",

//   package_type: "family",
//   display_order: 0,

//   price: "",
//   duration_days: "",
//   duration_nights: "",

//   description: "",

//   status: "draft",

//   is_popular: false,
//   is_recommended: false,
//   is_trending: false,
//   is_featured: false,
//   is_new: false,
//   is_most_visited: false,

//   images: [],
//   itinerary: [],

//   facilities: [],
//   inclusions: [],
//   exclusions: [],

//   terms_and_conditions: "",
//   cancellation_policy: "",
// };

// const INPUT_CLASS =
//   "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

// const SELECT_CLASS =
//   "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all focus:border-rose-300 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-surface";

// const TEXTAREA_CLASS =
//   "w-full min-w-0 rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink-800 outline-none transition-all placeholder:text-placeholder resize-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

// const LABEL_CLASS =
//   "mb-1.5 block text-sm font-semibold text-ink-800";

// const HELP_CLASS =
//   "mt-1.5 text-xs leading-relaxed text-ink-500";

// function getDestinationName(destination) {
//   return (
//     destination?.place_name ||
//     destination?.name ||
//     destination?.title ||
//     ""
//   );
// }

// function getImageUrl(image) {
//   if (typeof image === "string") {
//     return image;
//   }

//   return image?.url || "";
// }

// function getApiError(error, fallback) {
//   const detail = error?.response?.data?.detail;

//   if (Array.isArray(detail)) {
//     return detail
//       .map((item) => {
//         const field = Array.isArray(item?.loc)
//           ? item.loc
//               .filter((part) => part !== "body")
//               .join(".")
//           : "";

//         return field
//           ? `${field}: ${item?.msg || "Validation error"}`
//           : item?.msg || "Validation error";
//       })
//       .join("\n");
//   }

//   if (typeof detail === "string") {
//     return detail;
//   }

//   return (
//     error?.message ||
//     fallback
//   );
// }

// export default function PackagesManage() {
//   const [packages, setPackages] = useState([]);

//   const [destinations, setDestinations] = useState([]);
//   const [seasonedDestinations, setSeasonedDestinations] =
//     useState([]);

//   const [loading, setLoading] = useState(true);
//   const [destinationsLoading, setDestinationsLoading] =
//     useState(true);
//   const [seasonedLoading, setSeasonedLoading] =
//     useState(true);

//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(EMPTY_FORM);

//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [typeFilter, setTypeFilter] = useState("all");

//   // =========================================================
//   // LOAD PACKAGES
//   // =========================================================

//   const load = async () => {
//     try {
//       setLoading(true);

//       const data = await getAllPackagesAdmin();

//       setPackages(
//         Array.isArray(data)
//           ? data
//           : Array.isArray(data?.items)
//           ? data.items
//           : Array.isArray(data?.data)
//           ? data.data
//           : []
//       );
//     } catch (err) {
//       console.error(
//         "Failed to load packages:",
//         err
//       );

//       setError(
//         getApiError(
//           err,
//           "Could not load packages."
//         )
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   // =========================================================
//   // LOAD MOST VISITED DESTINATIONS
//   // =========================================================

// const loadDestinations = async () => {
//   try {
//     setDestinationsLoading(true);

//     const data = await getAllMostVisitedAdmin();

//     const items = Array.isArray(data)
//       ? data
//       : Array.isArray(data?.items)
//       ? data.items
//       : Array.isArray(data?.data)
//       ? data.data
//       : [];

//     setDestinations(items);
//   } catch (err) {
//     console.error(
//       "Failed to load destinations:",
//       err
//     );

//     setDestinations([]);

//     setError(
//       getApiError(
//         err,
//         "Could not load Most Visited destinations."
//       )
//     );
//   } finally {
//     setDestinationsLoading(false);
//   }
// };

//   useEffect(() => {
//     loadDestinations();
//   }, []);

//   // =========================================================
//   // LOAD SEASONED DESTINATIONS
//   // =========================================================

// const loadSeasonedDestinations = async () => {
//   try {
//     setSeasonedLoading(true);

//     const data = await getAllSeasonedDestinations();

//     const items = Array.isArray(data)
//       ? data
//       : Array.isArray(data?.items)
//       ? data.items
//       : Array.isArray(data?.data)
//       ? data.data
//       : [];

//     setSeasonedDestinations(items);
//   } catch (err) {
//     console.error(
//       "Failed to load seasoned destinations:",
//       err
//     );

//     setSeasonedDestinations([]);

//     /*
//      * Seasonal destinations are optional for packages,
//      * so package creation/editing can continue even if
//      * this endpoint is temporarily unavailable.
//      */
//   } finally {
//     setSeasonedLoading(false);
//   }
// };

//   useEffect(() => {
//     loadSeasonedDestinations();
//   }, []);

//   // =========================================================
//   // FORM HELPERS
//   // =========================================================

//   const updateField = (field, value) => {
//     setForm((current) => ({
//       ...current,
//       [field]: value,
//     }));
//   };

//   const toggleDiscovery = (field) => {
//     setForm((current) => ({
//       ...current,
//       [field]: !current[field],
//     }));
//   };

//   // =========================================================
//   // FILTERED PACKAGES
//   // =========================================================

//   const filteredPackages = useMemo(() => {
//     const normalizedSearch =
//       search.trim().toLowerCase();

//     return packages.filter((pkg) => {
//       const matchesSearch =
//         !normalizedSearch ||
//         String(pkg?.title || "")
//           .toLowerCase()
//           .includes(normalizedSearch) ||
//         String(pkg?.destination || "")
//           .toLowerCase()
//           .includes(normalizedSearch);

//       const matchesStatus =
//         statusFilter === "all" ||
//         pkg?.status === statusFilter;

//       const matchesType =
//         typeFilter === "all" ||
//         pkg?.package_type === typeFilter;

//       return (
//         matchesSearch &&
//         matchesStatus &&
//         matchesType
//       );
//     });
//   }, [
//     packages,
//     search,
//     statusFilter,
//     typeFilter,
//   ]);

//   // =========================================================
//   // OPEN CREATE
//   // =========================================================

//   const openCreate = () => {
//     setForm({
//       ...EMPTY_FORM,
//       images: [],
//       itinerary: [],
//       facilities: [],
//       inclusions: [],
//       exclusions: [],
//     });

//     setError("");
//     setEditing({});
//   };

//   // =========================================================
//   // OPEN EDIT
//   // =========================================================

//   const openEdit = (pkg) => {
//     setForm({
//       title: pkg?.title || "",

//       destination:
//         pkg?.destination || "",

//       destination_id:
//         pkg?.destination_id ??
//         pkg?.destination_obj?.id ??
//         "",

//       seasoned_destination_id:
//         pkg?.seasoned_destination_id ??
//         pkg?.seasoned_destination_obj?.id ??
//         "",

//       package_type:
//         pkg?.package_type ||
//         "family",

//       display_order:
//         pkg?.display_order ?? 0,

//       price:
//         pkg?.price ?? "",

//       duration_days:
//         pkg?.duration_days ?? "",

//       duration_nights:
//         pkg?.duration_nights ??
//         (
//           (Number(pkg?.duration_days) || 0) > 0
//             ? Math.max(
//                 Number(pkg.duration_days) - 1,
//                 0
//               )
//             : ""
//         ),

//       description:
//         pkg?.description || "",

//       status:
//         pkg?.status || "draft",

//       is_popular:
//         Boolean(pkg?.is_popular),

//       is_recommended:
//         Boolean(pkg?.is_recommended),

//       is_trending:
//         Boolean(pkg?.is_trending),

//       is_featured:
//         Boolean(pkg?.is_featured),

//       is_new:
//         Boolean(pkg?.is_new),

//       is_most_visited:
//         Boolean(pkg?.is_most_visited),

//       images:
//         Array.isArray(pkg?.images)
//           ? pkg.images
//           : [],

//       itinerary:
//         Array.isArray(pkg?.itinerary)
//           ? pkg.itinerary.map(
//               (item, index) => ({
//                 day: index + 1,
//                 title:
//                   item?.title || "",
//                 description:
//                   item?.description || "",
//                 image:
//                   getImageUrl(
//                     item?.image
//                   ) || null,
//               })
//             )
//           : [],

//       facilities:
//         Array.isArray(pkg?.facilities)
//           ? pkg.facilities
//           : [],

//       inclusions:
//         Array.isArray(pkg?.inclusions)
//           ? pkg.inclusions
//           : [],

//       exclusions:
//         Array.isArray(pkg?.exclusions)
//           ? pkg.exclusions
//           : [],

//       terms_and_conditions:
//         pkg?.terms_and_conditions || "",

//       cancellation_policy:
//         pkg?.cancellation_policy || "",
//     });

//     setError("");
//     setEditing(pkg);
//   };

//   // =========================================================
//   // RESOLVE LEGACY DESTINATION
//   // =========================================================

//   useEffect(() => {
//     if (
//       !form.destination_id &&
//       form.destination &&
//       destinations.length > 0
//     ) {
//       const normalized =
//         form.destination
//           .trim()
//           .toLowerCase();

//       const match =
//         destinations.find(
//           (destination) => {
//             const name =
//               getDestinationName(
//                 destination
//               );

//             return (
//               name
//                 .trim()
//                 .toLowerCase() ===
//               normalized
//             );
//           }
//         );

//       if (match?.id) {
//         setForm((current) => ({
//           ...current,
//           destination_id:
//             Number(match.id),
//           destination:
//             getDestinationName(
//               match
//             ) ||
//             current.destination,
//         }));
//       }
//     }
//   }, [
//     destinations,
//     form.destination,
//     form.destination_id,
//   ]);

//   // =========================================================
//   // ITINERARY
//   // =========================================================

//   const addItineraryDay = () => {
//     setForm((current) => ({
//       ...current,
//       itinerary: [
//         ...current.itinerary,
//         {
//           day:
//             current.itinerary.length + 1,
//           title: "",
//           description: "",
//           image: null,
//         },
//       ],
//     }));
//   };

//   const updateItineraryDay = (
//     index,
//     field,
//     value
//   ) => {
//     setForm((current) => ({
//       ...current,

//       itinerary:
//         current.itinerary.map(
//           (item, i) =>
//             i === index
//               ? {
//                   ...item,
//                   [field]: value,
//                 }
//               : item
//         ),
//     }));
//   };

//   const removeItineraryDay = (
//     index
//   ) => {
//     setForm((current) => ({
//       ...current,

//       itinerary:
//         current.itinerary
//           .filter(
//             (_, i) => i !== index
//           )
//           .map((item, i) => ({
//             ...item,
//             day: i + 1,
//           })),
//     }));
//   };

//   const addItineraryImage = (
//     index,
//     img
//   ) => {
//     if (!img?.url) return;

//     setForm((current) => ({
//       ...current,

//       itinerary:
//         current.itinerary.map(
//           (item, i) =>
//             i === index
//               ? {
//                   ...item,
//                   image: img.url,
//                 }
//               : item
//         ),
//     }));
//   };

//   const removeItineraryImage = (
//     index
//   ) => {
//     setForm((current) => ({
//       ...current,

//       itinerary:
//         current.itinerary.map(
//           (item, i) =>
//             i === index
//               ? {
//                   ...item,
//                   image: null,
//                 }
//               : item
//         ),
//     }));
//   };

//   // =========================================================
//   // PACKAGE IMAGES
//   // =========================================================

//   const addImage = (img) => {
//     if (!img?.url) return;

//     setForm((current) => ({
//       ...current,

//       images: [
//         ...current.images,
//         img,
//       ],
//     }));
//   };

//   const removeImage = (index) => {
//     setForm((current) => ({
//       ...current,

//       images:
//         current.images.filter(
//           (_, i) => i !== index
//         ),
//     }));
//   };

//   // =========================================================
//   // LIST FIELDS
//   // =========================================================

//   const addListItem = (field) => {
//     setForm((current) => ({
//       ...current,

//       [field]: [
//         ...current[field],
//         "",
//       ],
//     }));
//   };

//   const updateListItem = (
//     field,
//     index,
//     value
//   ) => {
//     setForm((current) => ({
//       ...current,

//       [field]:
//         current[field].map(
//           (item, i) =>
//             i === index
//               ? value
//               : item
//         ),
//     }));
//   };

//   const removeListItem = (
//     field,
//     index
//   ) => {
//     setForm((current) => ({
//       ...current,

//       [field]:
//         current[field].filter(
//           (_, i) => i !== index
//         ),
//     }));
//   };

//   // =========================================================
//   // SAVE PACKAGE
//   // =========================================================

//   const handleSave = async (e) => {
//     e.preventDefault();

//     setSaving(true);
//     setError("");

//     try {
//       if (!form.title.trim()) {
//         setError(
//           "Package title is required."
//         );
//         return;
//       }

//       if (
//         !Number(form.destination_id)
//       ) {
//         setError(
//           "Please select a destination from Most Visited destinations."
//         );
//         return;
//       }

//       if (
//         !Number(form.price) ||
//         Number(form.price) <= 0
//       ) {
//         setError(
//           "Price must be greater than 0."
//         );
//         return;
//       }

//       if (
//         !Number(form.duration_days) ||
//         Number(form.duration_days) < 1
//       ) {
//         setError(
//           "Duration (days) must be at least 1."
//         );
//         return;
//       }

//       const payload = {
//         // ===================================================
//         // BASIC
//         // ===================================================

//         title:
//           form.title.trim(),

//         destination:
//           form.destination.trim(),

//         destination_id:
//           Number(
//             form.destination_id
//           ),

//         seasoned_destination_id:
//           form.seasoned_destination_id
//             ? Number(
//                 form.seasoned_destination_id
//               )
//             : null,

//         package_type:
//           form.package_type,

//         display_order:
//           Number(
//             form.display_order
//           ) || 0,

//         price:
//           Number(form.price),

//         duration_days:
//           Number(
//             form.duration_days
//           ),

//         duration_nights:
//           Number(
//             form.duration_nights ||
//               Math.max(
//                 Number(
//                   form.duration_days
//                 ) - 1,
//                 0
//               )
//           ),

//         description:
//           form.description.trim() ||
//           null,

//         status:
//           form.status,

//         // ===================================================
//         // DISCOVERY
//         // ===================================================

//         is_popular:
//           Boolean(
//             form.is_popular
//           ),

//         is_recommended:
//           Boolean(
//             form.is_recommended
//           ),

//         is_trending:
//           Boolean(
//             form.is_trending
//           ),

//         is_featured:
//           Boolean(
//             form.is_featured
//           ),

//         is_new:
//           Boolean(form.is_new),

//         is_most_visited:
//           Boolean(
//             form.is_most_visited
//           ),

//         // ===================================================
//         // IMAGES
//         // ===================================================

//         images:
//           form.images
//             .filter(
//               (img) =>
//                 Boolean(img?.url)
//             )
//             .map((img) => ({
//               url: img.url,

//               ...(img?.public_id
//                 ? {
//                     public_id:
//                       img.public_id,
//                   }
//                 : {}),
//             })),

//         // ===================================================
//         // ITINERARY
//         // ===================================================

//         itinerary:
//           form.itinerary.map(
//             (item, index) => ({
//               day: index + 1,

//               title:
//                 item?.title?.trim() ||
//                 "",

//               description:
//                 item?.description?.trim() ||
//                 "",

//               image:
//                 item?.image || null,
//             })
//           ),

//         // ===================================================
//         // FACILITIES
//         // ===================================================

//         facilities:
//           form.facilities
//             .map((item) =>
//               item.trim()
//             )
//             .filter(Boolean),

//         // ===================================================
//         // INCLUSIONS
//         // ===================================================

//         inclusions:
//           form.inclusions
//             .map((item) =>
//               item.trim()
//             )
//             .filter(Boolean),

//         // ===================================================
//         // EXCLUSIONS
//         // ===================================================

//         exclusions:
//           form.exclusions
//             .map((item) =>
//               item.trim()
//             )
//             .filter(Boolean),

//         // ===================================================
//         // POLICIES
//         // ===================================================

//         terms_and_conditions:
//           form.terms_and_conditions.trim() ||
//           null,

//         cancellation_policy:
//           form.cancellation_policy.trim() ||
//           null,
//       };

//       console.log(
//         "Saving package:",
//         payload
//       );

//       if (editing?.id) {
//         await updatePackage(
//           editing.id,
//           payload
//         );
//       } else {
//         await createPackage(
//           payload
//         );
//       }

//       setEditing(null);
//       setForm(EMPTY_FORM);

//       await load();
//     } catch (err) {
//       console.error(
//         "Package save failed:",
//         err
//       );

//       setError(
//         getApiError(
//           err,
//           "Failed to save package."
//         )
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // =========================================================
//   // DELETE
//   // =========================================================

//   const handleDelete = async (
//     id
//   ) => {
//     if (
//       !window.confirm(
//         "Delete this package? This action cannot be undone."
//       )
//     ) {
//       return;
//     }

//     try {
//       await deletePackage(id);

//       await load();
//     } catch (err) {
//       console.error(
//         "Package delete failed:",
//         err
//       );

//       setError(
//         getApiError(
//           err,
//           "Could not delete package."
//         )
//       );
//     }
//   };

//   // =========================================================
//   // CLOSE MODAL
//   // =========================================================

//   const closeModal = () => {
//     if (saving) return;

//     setEditing(null);
//     setForm(EMPTY_FORM);
//     setError("");
//   };

//   // =========================================================
//   // DISCOVERY LABELS
//   // =========================================================

//   const getDiscoveryLabels = (
//     pkg
//   ) =>
//     DISCOVERY_OPTIONS.filter(
//       (option) =>
//         Boolean(pkg?.[option.key])
//     );

//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (
//     <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-background p-3 sm:p-5 md:p-6 lg:p-8">

//       {/* =====================================================
//           PAGE HEADER
//       ====================================================== */}

//       <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

//         <div className="min-w-0">
//           <div className="mb-2 flex items-center gap-2">
//             <span className="h-1.5 w-8 rounded-full bg-rose-500" />

//             <span className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
//               Manyara Prive Vacations
//             </span>
//           </div>

//           <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
//             Packages
//           </h1>

//           <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500">
//             Create and manage travel packages,
//             destinations, visibility sections,
//             itineraries and package policies.
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={openCreate}
//           className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-travel-hover focus:outline-none focus:ring-4 focus:ring-rose-100 sm:w-auto"
//         >
//           <span className="text-lg leading-none transition-transform duration-200 group-hover:rotate-90">
//             +
//           </span>

//           New Package
//         </button>
//       </div>

//       {/* =====================================================
//           ERROR
//       ====================================================== */}

//       {error && !editing && (
//         <div className="mb-5 flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text shadow-travel-card">
//           <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
//             !
//           </span>

//           <p className="whitespace-pre-line leading-6">
//             {error}
//           </p>
//         </div>
//       )}

//       {/* =====================================================
//           SUMMARY
//       ====================================================== */}

//       <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

//         <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
//           <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
//             Total Packages
//           </p>

//           <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
//             {packages.length}
//           </p>
//         </div>

//         <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
//           <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
//             Published
//           </p>

//           <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
//             {
//               packages.filter(
//                 (pkg) =>
//                   pkg.status ===
//                   "published"
//               ).length
//             }
//           </p>
//         </div>

//         <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
//           <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
//             Drafts
//           </p>

//           <p className="mt-1 font-display text-2xl font-semibold text-ink-800">
//             {
//               packages.filter(
//                 (pkg) =>
//                   pkg.status ===
//                   "draft"
//               ).length
//             }
//           </p>
//         </div>

//         <div className="rounded-2xl border border-border bg-white p-4 shadow-travel-card">
//           <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
//             Featured
//           </p>

//           <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
//             {
//               packages.filter(
//                 (pkg) =>
//                   Boolean(
//                     pkg.is_featured
//                   )
//               ).length
//             }
//           </p>
//         </div>

//       </div>

//       {/* =====================================================
//           FILTER BAR
//       ====================================================== */}

//       <div className="mb-5 rounded-2xl border border-border bg-white p-3 shadow-travel-card sm:p-4">

//         <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">

//           <div className="relative">
//             <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
//               ⌕
//             </span>

//             <input
//               type="search"
//               value={search}
//               onChange={(e) =>
//                 setSearch(
//                   e.target.value
//                 )
//               }
//               placeholder="Search package or destination..."
//               className={`${INPUT_CLASS} pl-10`}
//             />
//           </div>

//           <select
//             value={statusFilter}
//             onChange={(e) =>
//               setStatusFilter(
//                 e.target.value
//               )
//             }
//             className={SELECT_CLASS}
//           >
//             <option value="all">
//               All Statuses
//             </option>
//             <option value="published">
//               Published
//             </option>
//             <option value="draft">
//               Draft
//             </option>
//           </select>

//           <select
//             value={typeFilter}
//             onChange={(e) =>
//               setTypeFilter(
//                 e.target.value
//               )
//             }
//             className={SELECT_CLASS}
//           >
//             <option value="all">
//               All Package Types
//             </option>

//             {PACKAGE_TYPES.map(
//               (type) => (
//                 <option
//                   key={type.value}
//                   value={type.value}
//                 >
//                   {type.label}
//                 </option>
//               )
//             )}
//           </select>

//         </div>

//         <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
//           <p className="text-xs text-ink-500">
//             Showing{" "}
//             <span className="font-bold text-ink-700">
//               {filteredPackages.length}
//             </span>{" "}
//             of{" "}
//             <span className="font-bold text-ink-700">
//               {packages.length}
//             </span>{" "}
//             packages
//           </p>

//           {(search ||
//             statusFilter !==
//               "all" ||
//             typeFilter !==
//               "all") && (
//             <button
//               type="button"
//               onClick={() => {
//                 setSearch("");
//                 setStatusFilter(
//                   "all"
//                 );
//                 setTypeFilter(
//                   "all"
//                 );
//               }}
//               className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
//             >
//               Clear filters
//             </button>
//           )}
//         </div>
//       </div>

//       {/* =====================================================
//           PACKAGE TABLE
//       ====================================================== */}

//       {loading ? (
//         <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-travel-card">
//           <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-rose-100 border-t-rose-600" />

//           <p className="text-sm font-medium text-ink-500">
//             Loading packages...
//           </p>
//         </div>
//       ) : (
//         <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card">

//           <div className="border-b border-border bg-surface-alt px-4 py-3 sm:px-5">
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <div>
//                 <h2 className="font-display text-lg font-semibold text-ink-800">
//                   Package Catalogue
//                 </h2>

//                 <p className="text-xs text-ink-500">
//                   Manage package content and
//                   website visibility.
//                 </p>
//               </div>

//               <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
//                 {filteredPackages.length}{" "}
//                 package
//                 {filteredPackages.length ===
//                 1
//                   ? ""
//                   : "s"}
//               </span>
//             </div>
//           </div>

//           <div className="w-full overflow-x-auto">

//             <table className="w-full min-w-[1050px] text-sm">

//               <thead className="bg-surface text-[11px] uppercase tracking-[0.12em] text-ink-500">
//                 <tr>
//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Package
//                   </th>

//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Destination
//                   </th>

//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Type
//                   </th>

//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Price
//                   </th>

//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Visibility
//                   </th>

//                   <th className="px-5 py-3.5 text-left font-bold">
//                     Status
//                   </th>

//                   <th className="px-5 py-3.5 text-right font-bold">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredPackages.map(
//                   (pkg) => {
//                     const labels =
//                       getDiscoveryLabels(
//                         pkg
//                       );

//                     return (
//                       <tr
//                         key={pkg.id}
//                         className="border-t border-border transition-colors hover:bg-surface-alt"
//                       >

//                         {/* PACKAGE */}

//                         <td className="px-5 py-4">
//                           <div className="flex max-w-[280px] items-center gap-3">

//                             {getImageUrl(
//                               pkg?.images?.[0]
//                             ) ? (
//                               <img
//                                 src={getImageUrl(
//                                   pkg
//                                     ?.images?.[0]
//                                 )}
//                                 alt=""
//                                 className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
//                               />
//                             ) : (
//                               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-lg text-rose-600">
//                                 ✦
//                               </div>
//                             )}

//                             <div className="min-w-0">
//                               <p className="truncate font-semibold text-ink-800">
//                                 {pkg.title}
//                               </p>

//                               <p className="mt-0.5 truncate text-xs text-ink-500">
//                                 {pkg.duration_days}{" "}
//                                 days{" "}
//                                 {pkg.duration_nights ??
//                                   0}{" "}
//                                 nights
//                               </p>
//                             </div>

//                           </div>
//                         </td>

//                         {/* DESTINATION */}

//                         <td className="px-5 py-4">
//                           <span className="text-ink-700">
//                             {pkg.destination ||
//                               "—"}
//                           </span>

//                           {pkg.seasoned_destination_id && (
//                             <span className="mt-1 block text-[11px] font-semibold text-rose-600">
//                               Seasonal destination
//                             </span>
//                           )}
//                         </td>

//                         {/* TYPE */}

//                         <td className="px-5 py-4">
//                           <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
//                             {PACKAGE_TYPES.find(
//                               (type) =>
//                                 type.value ===
//                                 pkg.package_type
//                             )?.label ||
//                               pkg.package_type ||
//                               "Family"}
//                           </span>
//                         </td>

//                         {/* PRICE */}

//                         <td className="px-5 py-4 whitespace-nowrap">
//                           <span className="font-semibold text-ink-800">
//                             ₹
//                             {Number(
//                               pkg.price
//                             ).toLocaleString(
//                               "en-IN"
//                             )}
//                           </span>

//                           <span className="block text-[11px] text-ink-400">
//                             starting price
//                           </span>
//                         </td>

//                         {/* VISIBILITY */}

//                         <td className="px-5 py-4">
//                           <div className="flex max-w-[260px] flex-wrap gap-1.5">
//                             {labels.length >
//                             0 ? (
//                               labels.map(
//                                 (
//                                   option
//                                 ) => (
//                                   <span
//                                     key={
//                                       option.key
//                                     }
//                                     className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700"
//                                   >
//                                     {
//                                       option.label
//                                     }
//                                   </span>
//                                 )
//                               )
//                             ) : (
//                               <span className="text-xs text-ink-400">
//                                 No labels
//                               </span>
//                             )}
//                           </div>
//                         </td>

//                         {/* STATUS */}

//                         <td className="px-5 py-4">
//                           <span
//                             className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
//                               pkg.status ===
//                               "published"
//                                 ? "bg-success-bg text-success-text"
//                                 : "bg-surface-strong text-ink-600"
//                             }`}
//                           >
//                             <span
//                               className={`h-1.5 w-1.5 rounded-full ${
//                                 pkg.status ===
//                                 "published"
//                                   ? "bg-success"
//                                   : "bg-ink-400"
//                               }`}
//                             />

//                             {pkg.status ===
//                             "published"
//                               ? "Published"
//                               : "Draft"}
//                           </span>
//                         </td>

//                         {/* ACTIONS */}

//                         <td className="px-5 py-4 text-right">
//                           <div className="flex items-center justify-end gap-2">

//                             <button
//                               type="button"
//                               onClick={() =>
//                                 openEdit(
//                                   pkg
//                                 )
//                               }
//                               className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:border-rose-200 hover:bg-rose-100"
//                             >
//                               Edit
//                             </button>

//                             <button
//                               type="button"
//                               onClick={() =>
//                                 handleDelete(
//                                   pkg.id
//                                 )
//                               }
//                               className="rounded-lg border border-error/15 bg-error-bg px-3 py-1.5 text-xs font-bold text-error-text transition-colors hover:border-error/25"
//                             >
//                               Delete
//                             </button>

//                           </div>
//                         </td>

//                       </tr>
//                     );
//                   }
//                 )}

//                 {filteredPackages.length ===
//                   0 && (
//                   <tr>
//                     <td
//                       colSpan={7}
//                       className="px-5 py-14 text-center"
//                     >
//                       <div className="mx-auto flex max-w-sm flex-col items-center">
//                         <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl text-rose-600">
//                           ✦
//                         </div>

//                         <p className="font-display text-lg font-semibold text-ink-800">
//                           No packages found
//                         </p>

//                         <p className="mt-1 text-sm leading-6 text-ink-500">
//                           Try changing your
//                           filters or create a
//                           new travel package.
//                         </p>

//                         {!search &&
//                           statusFilter ===
//                             "all" &&
//                           typeFilter ===
//                             "all" && (
//                             <button
//                               type="button"
//                               onClick={
//                                 openCreate
//                               }
//                               className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-brand transition-colors hover:bg-rose-700"
//                             >
//                               Create First
//                               Package
//                             </button>
//                           )}
//                       </div>
//                     </td>
//                   </tr>
//                 )}

//               </tbody>

//             </table>
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           CREATE / EDIT MODAL
//       ====================================================== */}

//       {editing !== null && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-2 backdrop-blur-sm sm:p-4">

//           <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl sm:h-[94vh] sm:rounded-3xl">

//             {/* =================================================
//                 MODAL HEADER
//             ================================================== */}

//             <div className="shrink-0 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">

//               <div className="flex items-start justify-between gap-4">

//                 <div className="min-w-0">

//                   <div className="mb-1.5 flex items-center gap-2">
//                     <span className="h-1.5 w-6 rounded-full bg-rose-500" />

//                     <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
//                       Package Manager
//                     </span>
//                   </div>

//                   <h2 className="font-display text-2xl font-semibold text-ink-800">
//                     {editing?.id
//                       ? "Edit Package"
//                       : "Create New Package"}
//                   </h2>

//                   <p className="mt-1 text-xs leading-5 text-ink-500 sm:text-sm">
//                     Manage package content,
//                     destinations, itinerary,
//                     images and website visibility.
//                   </p>

//                 </div>

//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   disabled={saving}
//                   className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
//                   aria-label="Close"
//                 >
//                   ×
//                 </button>

//               </div>

//             </div>

//             {/* =================================================
//                 FORM
//             ================================================== */}

//             <form
//               onSubmit={handleSave}
//               className="min-h-0 flex-1 overflow-y-auto"
//             >

//               <div className="space-y-7 p-4 sm:p-6 lg:p-8">

//                 {/* =================================================
//                     BASIC DETAILS
//                 ================================================== */}

//                 <section className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-5">

//                   <div className="mb-5">
//                     <h3 className="font-display text-xl font-semibold text-ink-800">
//                       Basic Details
//                     </h3>

//                     <p className="mt-1 text-xs leading-5 text-ink-500">
//                       Define the main package information,
//                       pricing and destination.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

//                     {/* TITLE */}

//                     <div className="sm:col-span-2">
//                       <label
//                         htmlFor="package-title"
//                         className={LABEL_CLASS}
//                       >
//                         Package Title
//                       </label>

//                       <input
//                         id="package-title"
//                         required
//                         value={form.title}
//                         onChange={(e) =>
//                           updateField(
//                             "title",
//                             e.target.value
//                           )
//                         }
//                         placeholder="Example: Kerala 5 Days Premium Package"
//                         className={INPUT_CLASS}
//                       />
//                     </div>

//                     {/* MOST VISITED DESTINATION */}

//                     <div>
//                       <label
//                         htmlFor="package-destination"
//                         className={LABEL_CLASS}
//                       >
//                         Destination
//                       </label>

//                       <select
//                         id="package-destination"
//                         required
//                         value={
//                           form.destination_id
//                         }
//                         disabled={
//                           destinationsLoading
//                         }
//                         onChange={(e) => {
//                           const selectedId =
//                             Number(
//                               e.target.value
//                             );

//                           const selected =
//                             destinations.find(
//                               (
//                                 destination
//                               ) =>
//                                 Number(
//                                   destination?.id
//                                 ) ===
//                                 selectedId
//                             );

//                           setForm(
//                             (current) => ({
//                               ...current,

//                               destination_id:
//                                 selectedId ||
//                                 "",

//                               destination:
//                                 getDestinationName(
//                                   selected
//                                 ),
//                             })
//                           );
//                         }}
//                         className={
//                           SELECT_CLASS
//                         }
//                       >
//                         <option value="">
//                           {destinationsLoading
//                             ? "Loading destinations..."
//                             : "Select destination"}
//                         </option>

//                         {destinations.map(
//                           (
//                             destination
//                           ) => (
//                             <option
//                               key={
//                                 destination.id
//                               }
//                               value={
//                                 destination.id
//                               }
//                             >
//                               {getDestinationName(
//                                 destination
//                               )}
//                             </option>
//                           )
//                         )}
//                       </select>

//                       <p className={HELP_CLASS}>
//                         Select the primary
//                         destination from
//                         Most Visited.
//                       </p>
//                     </div>

//                     {/* SEASONED DESTINATION */}

//                     <div>
//                       <label
//                         htmlFor="seasoned-destination"
//                         className={LABEL_CLASS}
//                       >
//                         Seasoned Destination
//                         <span className="ml-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-600">
//                           Optional
//                         </span>
//                       </label>

//                       <select
//                         id="seasoned-destination"
//                         value={
//                           form.seasoned_destination_id
//                         }
//                         disabled={
//                           seasonedLoading
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "seasoned_destination_id",
//                             e.target.value
//                           )
//                         }
//                         className={
//                           SELECT_CLASS
//                         }
//                       >
//                         <option value="">
//                           {seasonedLoading
//                             ? "Loading seasonal destinations..."
//                             : "No seasonal destination"}
//                         </option>

//                         {seasonedDestinations
//                           .filter(
//                             (
//                               destination
//                             ) =>
//                               destination?.status ===
//                                 undefined ||
//                               destination?.status ===
//                                 "published"
//                           )
//                           .map(
//                             (
//                               destination
//                             ) => (
//                               <option
//                                 key={
//                                   destination.id
//                                 }
//                                 value={
//                                   destination.id
//                                 }
//                               >
//                                 {getDestinationName(
//                                   destination
//                                 )}
//                               </option>
//                             )
//                           )}
//                       </select>

//                       <p className={HELP_CLASS}>
//                         Link this package to a
//                         seasonal destination when
//                         applicable.
//                       </p>
//                     </div>

//                     {/* PACKAGE TYPE */}

//                     <div>
//                       <label
//                         htmlFor="package-type"
//                         className={LABEL_CLASS}
//                       >
//                         Package Type
//                       </label>

//                       <select
//                         id="package-type"
//                         value={
//                           form.package_type
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "package_type",
//                             e.target.value
//                           )
//                         }
//                         className={
//                           SELECT_CLASS
//                         }
//                       >
//                         {PACKAGE_TYPES.map(
//                           (type) => (
//                             <option
//                               key={
//                                 type.value
//                               }
//                               value={
//                                 type.value
//                               }
//                             >
//                               {type.label}
//                             </option>
//                           )
//                         )}
//                       </select>
//                     </div>

//                     {/* STATUS */}

//                     <div>
//                       <label
//                         htmlFor="package-status"
//                         className={LABEL_CLASS}
//                       >
//                         Publishing Status
//                       </label>

//                       <select
//                         id="package-status"
//                         value={
//                           form.status
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "status",
//                             e.target.value
//                           )
//                         }
//                         className={
//                           SELECT_CLASS
//                         }
//                       >
//                         <option value="draft">
//                           Draft
//                         </option>

//                         <option value="published">
//                           Published
//                         </option>
//                       </select>
//                     </div>

//                     {/* PRICE */}

//                     <div>
//                       <label
//                         htmlFor="package-price"
//                         className={LABEL_CLASS}
//                       >
//                         Starting Price (₹)
//                       </label>

//                       <div className="relative">
//                         <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-500">
//                           ₹
//                         </span>

//                         <input
//                           id="package-price"
//                           type="number"
//                           required
//                           min="1"
//                           step="0.01"
//                           value={form.price}
//                           onChange={(e) =>
//                             updateField(
//                               "price",
//                               e.target.value
//                             )
//                           }
//                           placeholder="25000"
//                           className={`${INPUT_CLASS} pl-8`}
//                         />
//                       </div>
//                     </div>

//                     {/* DISPLAY ORDER */}

//                     <div>
//                       <label
//                         htmlFor="package-order"
//                         className={LABEL_CLASS}
//                       >
//                         Display Order
//                       </label>

//                       <input
//                         id="package-order"
//                         type="number"
//                         min="0"
//                         value={
//                           form.display_order
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "display_order",
//                             e.target.value
//                           )
//                         }
//                         placeholder="0"
//                         className={
//                           INPUT_CLASS
//                         }
//                       />

//                       <p className={HELP_CLASS}>
//                         Lower numbers appear first.
//                       </p>
//                     </div>

//                     {/* DAYS */}

//                     <div>
//                       <label
//                         htmlFor="package-days"
//                         className={LABEL_CLASS}
//                       >
//                         Duration — Days
//                       </label>

//                       <input
//                         id="package-days"
//                         type="number"
//                         required
//                         min="1"
//                         value={
//                           form.duration_days
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "duration_days",
//                             e.target.value
//                           )
//                         }
//                         placeholder="5"
//                         className={
//                           INPUT_CLASS
//                         }
//                       />
//                     </div>

//                     {/* NIGHTS */}

//                     <div>
//                       <label
//                         htmlFor="package-nights"
//                         className={LABEL_CLASS}
//                       >
//                         Duration — Nights
//                       </label>

//                       <input
//                         id="package-nights"
//                         type="number"
//                         required
//                         min="0"
//                         value={
//                           form.duration_nights
//                         }
//                         onChange={(e) =>
//                           updateField(
//                             "duration_nights",
//                             e.target.value
//                           )
//                         }
//                         placeholder="4"
//                         className={
//                           INPUT_CLASS
//                         }
//                       />

//                       <p className={HELP_CLASS}>
//                         Usually days minus one.
//                         Example: 5 days = 4 nights.
//                       </p>
//                     </div>

//                   </div>
//                 </section>

//                 {/* =================================================
//                     DISCOVERY / VISIBILITY
//                 ================================================== */}

//                 <section className="rounded-2xl border border-rose-100 bg-brand-gradient p-4 sm:p-5">

//                   <div className="mb-5">
//                     <div className="flex items-center gap-2">
//                       <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
//                         ✦
//                       </span>

//                       <div>
//                         <h3 className="font-display text-xl font-semibold text-ink-800">
//                           Website Visibility
//                         </h3>

//                         <p className="text-xs text-ink-500">
//                           Choose where this package
//                           should appear.
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

//                     {DISCOVERY_OPTIONS.map(
//                       (option) => {
//                         const checked =
//                           Boolean(
//                             form[
//                               option.key
//                             ]
//                           );

//                         return (
//                           <label
//                             key={
//                               option.key
//                             }
//                             className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
//                               checked
//                                 ? "border-rose-200 bg-white shadow-travel-card"
//                                 : "border-border/70 bg-white/70 hover:border-rose-100 hover:bg-white"
//                             }`}
//                           >

//                             <span
//                               className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
//                                 checked
//                                   ? "border-rose-600 bg-rose-600 text-white"
//                                   : "border-border bg-white text-transparent"
//                               }`}
//                             >
//                               {checked &&
//                                 "✓"}
//                             </span>

//                             <input
//                               type="checkbox"
//                               checked={
//                                 checked
//                               }
//                               onChange={() =>
//                                 toggleDiscovery(
//                                   option.key
//                                 )
//                               }
//                               className="sr-only"
//                             />

//                             <span className="min-w-0">
//                               <span className="block text-sm font-bold text-ink-800">
//                                 {
//                                   option.label
//                                 }
//                               </span>

//                               <span className="mt-0.5 block text-xs leading-5 text-ink-500">
//                                 {
//                                   option.description
//                                 }
//                               </span>
//                             </span>

//                           </label>
//                         );
//                       }
//                     )}

//                   </div>

//                   <div className="mt-4 rounded-2xl border border-white/80 bg-white/75 p-4">
//                     <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
//                       Current discovery labels
//                     </p>

//                     <div className="flex flex-wrap gap-2">
//                       {DISCOVERY_OPTIONS.filter(
//                         (option) =>
//                           form[
//                             option.key
//                           ]
//                       ).map(
//                         (option) => (
//                           <span
//                             key={
//                               option.key
//                             }
//                             className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100"
//                           >
//                             {
//                               option.label
//                             }
//                           </span>
//                         )
//                       )}

//                       {DISCOVERY_OPTIONS.every(
//                         (option) =>
//                           !form[
//                             option.key
//                           ]
//                       ) && (
//                         <span className="text-xs text-ink-400">
//                           No discovery sections selected.
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </section>

//                 {/* =================================================
//                     DESCRIPTION
//                 ================================================== */}

//                 <section>
//                   <div className="mb-3">
//                     <h3 className="font-display text-xl font-semibold text-ink-800">
//                       Package Description
//                     </h3>

//                     <p className="mt-1 text-xs text-ink-500">
//                       Give travellers a clear
//                       overview of the experience.
//                     </p>
//                   </div>

//                   <textarea
//                     rows={6}
//                     value={
//                       form.description
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "description",
//                         e.target.value
//                       )
//                     }
//                     placeholder="Describe the destination, experience, highlights and what makes this package special..."
//                     className={
//                       TEXTAREA_CLASS
//                     }
//                   />
//                 </section>

//                 {/* =================================================
//                     ITINERARY
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

//                     <div>
//                       <h3 className="font-display text-xl font-semibold text-ink-800">
//                         Day-by-Day Itinerary
//                       </h3>

//                       <p className="mt-1 text-xs leading-5 text-ink-500">
//                         Add activities, descriptions
//                         and a dedicated image for each
//                         day.
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={
//                         addItineraryDay
//                       }
//                       className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 sm:w-auto"
//                     >
//                       + Add Day
//                     </button>

//                   </div>

//                   {form.itinerary.length ===
//                     0 && (
//                     <div className="rounded-2xl border border-dashed border-rose-200 bg-brand-gradient p-8 text-center">
//                       <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-rose-600 shadow-sm">
//                         ✦
//                       </div>

//                       <p className="font-semibold text-ink-700">
//                         No itinerary days yet
//                       </p>

//                       <p className="mt-1 text-xs text-ink-500">
//                         Click “Add Day” to
//                         create Day 1.
//                       </p>
//                     </div>
//                   )}

//                   <div className="space-y-4">

//                     {form.itinerary.map(
//                       (
//                         item,
//                         index
//                       ) => (
//                         <div
//                           key={index}
//                           className="overflow-hidden rounded-2xl border border-border bg-white shadow-travel-card"
//                         >

//                           {/* DAY HEADER */}

//                           <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-alt px-4 py-3.5 sm:px-5">

//                             <div className="flex min-w-0 items-center gap-3">

//                               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm">
//                                 {index +
//                                   1}
//                               </div>

//                               <div className="min-w-0">
//                                 <p className="text-sm font-bold text-ink-800">
//                                   Day{" "}
//                                   {index +
//                                     1}
//                                 </p>

//                                 <p className="truncate text-xs text-ink-500">
//                                   Day{" "}
//                                   {index +
//                                     1}{" "}
//                                   itinerary
//                                   details
//                                 </p>
//                               </div>

//                             </div>

//                             <button
//                               type="button"
//                               onClick={() =>
//                                 removeItineraryDay(
//                                   index
//                                 )
//                               }
//                               className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-error-text transition-colors hover:bg-error-bg"
//                             >
//                               Remove
//                             </button>

//                           </div>

//                           <div className="p-4 sm:p-5">

//                             {/* DAY TITLE */}

//                             <div className="mb-4">
//                               <label
//                                 className={LABEL_CLASS}
//                               >
//                                 Day{" "}
//                                 {index +
//                                   1}{" "}
//                                 Title
//                               </label>

//                               <input
//                                 required
//                                 value={
//                                   item?.title ||
//                                   ""
//                                 }
//                                 onChange={(
//                                   e
//                                 ) =>
//                                   updateItineraryDay(
//                                     index,
//                                     "title",
//                                     e
//                                       .target
//                                       .value
//                                   )
//                                 }
//                                 placeholder="Example: Arrival in Kochi & Local Sightseeing"
//                                 className={
//                                   INPUT_CLASS
//                                 }
//                               />
//                             </div>

//                             {/* DAY DESCRIPTION */}

//                             <div className="mb-5">
//                               <label
//                                 className={LABEL_CLASS}
//                               >
//                                 Day{" "}
//                                 {index +
//                                   1}{" "}
//                                 Description
//                               </label>

//                               <textarea
//                                 required
//                                 rows={4}
//                                 value={
//                                   item?.description ||
//                                   ""
//                                 }
//                                 onChange={(
//                                   e
//                                 ) =>
//                                   updateItineraryDay(
//                                     index,
//                                     "description",
//                                     e
//                                       .target
//                                       .value
//                                   )
//                                 }
//                                 placeholder="Describe activities, sightseeing, meals, transfers and experiences for this day..."
//                                 className={
//                                   TEXTAREA_CLASS
//                                 }
//                               />
//                             </div>

//                             {/* DAY IMAGE */}

//                             <div>
//                               <div className="mb-3 flex items-center justify-between gap-3">
//                                 <label className="text-sm font-bold text-ink-800">
//                                   Day{" "}
//                                   {index +
//                                     1}{" "}
//                                   Image
//                                 </label>

//                                 {item?.image && (
//                                   <span className="rounded-full bg-success-bg px-2.5 py-1 text-[10px] font-bold text-success-text">
//                                     Image added
//                                   </span>
//                                 )}
//                               </div>

//                               {item?.image ? (
//                                 <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-border bg-surface sm:h-60">

//                                   <img
//                                     src={
//                                       item.image
//                                     }
//                                     alt={
//                                       item?.title ||
//                                       `Day ${
//                                         index +
//                                         1
//                                       }`
//                                     }
//                                     className="h-full w-full object-cover"
//                                   />

//                                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent p-4">
//                                     <p className="text-xs font-bold text-white">
//                                       Day{" "}
//                                       {index +
//                                         1}
//                                     </p>

//                                     {item?.title && (
//                                       <p className="mt-0.5 truncate text-sm font-semibold text-white">
//                                         {
//                                           item.title
//                                         }
//                                       </p>
//                                     )}
//                                   </div>

//                                   <button
//                                     type="button"
//                                     onClick={() =>
//                                       removeItineraryImage(
//                                         index
//                                       )
//                                     }
//                                     className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
//                                     aria-label={`Remove Day ${
//                                       index +
//                                       1
//                                     } image`}
//                                   >
//                                     ×
//                                   </button>

//                                 </div>
//                               ) : (
//                                 <div className="rounded-2xl border border-dashed border-border bg-surface-alt p-2">
//                                   <ImageUploadField
//                                     value={
//                                       null
//                                     }
//                                     onChange={(
//                                       img
//                                     ) =>
//                                       addItineraryImage(
//                                         index,
//                                         img
//                                       )
//                                     }
//                                     label=""
//                                   />
//                                 </div>
//                               )}
//                             </div>

//                           </div>
//                         </div>
//                       )
//                     )}

//                   </div>

//                   {form.itinerary.length >
//                     0 && (
//                     <button
//                       type="button"
//                       onClick={
//                         addItineraryDay
//                       }
//                       className="mt-4 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/50 py-3 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50"
//                     >
//                       + Add Day{" "}
//                       {form.itinerary
//                         .length + 1}
//                     </button>
//                   )}
//                 </section>

//                 {/* =================================================
//                     PACKAGE IMAGES
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-4">
//                     <h3 className="font-display text-xl font-semibold text-ink-800">
//                       Package Images
//                     </h3>

//                     <p className="mt-1 text-xs leading-5 text-ink-500">
//                       Add the main images used
//                       across package cards and
//                       the package detail page.
//                     </p>
//                   </div>

//                   <div className="flex flex-wrap gap-3">

//                     {form.images.map(
//                       (
//                         img,
//                         index
//                       ) => (
//                         <div
//                           key={index}
//                           className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-travel-card"
//                         >
//                           <img
//                             src={img?.url}
//                             alt=""
//                             className="h-full w-full object-cover"
//                           />

//                           <button
//                             type="button"
//                             onClick={() =>
//                               removeImage(
//                                 index
//                               )
//                             }
//                             className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink-700 shadow-lg transition-colors hover:bg-error-bg hover:text-error-text"
//                           >
//                             ×
//                           </button>

//                           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/60 to-transparent px-2 pb-2 pt-5 text-[10px] font-bold text-white">
//                             Image{" "}
//                             {index +
//                               1}
//                           </div>
//                         </div>
//                       )
//                     )}

//                     <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-1">
//                       <ImageUploadField
//                         value={null}
//                         onChange={
//                           addImage
//                         }
//                         label=""
//                       />
//                     </div>

//                   </div>
//                 </section>

//                 {/* =================================================
//                     FACILITIES
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-4 flex items-start justify-between gap-4">

//                     <div>
//                       <h3 className="font-display text-xl font-semibold text-ink-800">
//                         Facilities
//                       </h3>

//                       <p className="mt-1 text-xs text-ink-500">
//                         Hotel, breakfast,
//                         transport, AC, guide, etc.
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         addListItem(
//                           "facilities"
//                         )
//                       }
//                       className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
//                     >
//                       + Add
//                     </button>

//                   </div>

//                   <div className="space-y-2.5">
//                     {form.facilities.map(
//                       (
//                         item,
//                         index
//                       ) => (
//                         <div
//                           key={index}
//                           className="flex gap-2"
//                         >
//                           <input
//                             value={item}
//                             onChange={(
//                               e
//                             ) =>
//                               updateListItem(
//                                 "facilities",
//                                 index,
//                                 e
//                                   .target
//                                   .value
//                               )
//                             }
//                             placeholder="Example: Breakfast included"
//                             className={
//                               INPUT_CLASS
//                             }
//                           />

//                           <button
//                             type="button"
//                             onClick={() =>
//                               removeListItem(
//                                 "facilities",
//                                 index
//                               )
//                             }
//                             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
//                             aria-label="Remove facility"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       )
//                     )}

//                     {form.facilities.length ===
//                       0 && (
//                       <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
//                         No facilities added.
//                       </div>
//                     )}
//                   </div>
//                 </section>

//                 {/* =================================================
//                     INCLUSIONS
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-4 flex items-start justify-between gap-4">

//                     <div>
//                       <h3 className="font-display text-xl font-semibold text-ink-800">
//                         Inclusions
//                       </h3>

//                       <p className="mt-1 text-xs text-ink-500">
//                         What is included in the
//                         package?
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         addListItem(
//                           "inclusions"
//                         )
//                       }
//                       className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
//                     >
//                       + Add
//                     </button>

//                   </div>

//                   <div className="space-y-2.5">
//                     {form.inclusions.map(
//                       (
//                         item,
//                         index
//                       ) => (
//                         <div
//                           key={index}
//                           className="flex gap-2"
//                         >
//                           <input
//                             value={item}
//                             onChange={(
//                               e
//                             ) =>
//                               updateListItem(
//                                 "inclusions",
//                                 index,
//                                 e
//                                   .target
//                                   .value
//                               )
//                             }
//                             placeholder="Example: 4 nights hotel accommodation"
//                             className={
//                               INPUT_CLASS
//                             }
//                           />

//                           <button
//                             type="button"
//                             onClick={() =>
//                               removeListItem(
//                                 "inclusions",
//                                 index
//                               )
//                             }
//                             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
//                             aria-label="Remove inclusion"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       )
//                     )}

//                     {form.inclusions.length ===
//                       0 && (
//                       <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
//                         No inclusions added.
//                       </div>
//                     )}
//                   </div>
//                 </section>

//                 {/* =================================================
//                     EXCLUSIONS
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-4 flex items-start justify-between gap-4">

//                     <div>
//                       <h3 className="font-display text-xl font-semibold text-ink-800">
//                         Exclusions
//                       </h3>

//                       <p className="mt-1 text-xs text-ink-500">
//                         What is not included?
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         addListItem(
//                           "exclusions"
//                         )
//                       }
//                       className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
//                     >
//                       + Add
//                     </button>

//                   </div>

//                   <div className="space-y-2.5">
//                     {form.exclusions.map(
//                       (
//                         item,
//                         index
//                       ) => (
//                         <div
//                           key={index}
//                           className="flex gap-2"
//                         >
//                           <input
//                             value={item}
//                             onChange={(
//                               e
//                             ) =>
//                               updateListItem(
//                                 "exclusions",
//                                 index,
//                                 e
//                                   .target
//                                   .value
//                               )
//                             }
//                             placeholder="Example: Flight tickets"
//                             className={
//                               INPUT_CLASS
//                             }
//                           />

//                           <button
//                             type="button"
//                             onClick={() =>
//                               removeListItem(
//                                 "exclusions",
//                                 index
//                               )
//                             }
//                             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error/15 bg-error-bg text-sm font-bold text-error-text transition-colors hover:border-error/25"
//                             aria-label="Remove exclusion"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       )
//                     )}

//                     {form.exclusions.length ===
//                       0 && (
//                       <div className="rounded-xl border border-dashed border-border bg-surface-alt px-4 py-5 text-center text-xs text-ink-400">
//                         No exclusions added.
//                       </div>
//                     )}
//                   </div>
//                 </section>

//                 {/* =================================================
//                     TERMS
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-3">
//                     <h3 className="font-display text-xl font-semibold text-ink-800">
//                       Terms & Conditions
//                     </h3>

//                     <p className="mt-1 text-xs text-ink-500">
//                       Package-specific terms shown
//                       to travellers.
//                     </p>
//                   </div>

//                   <textarea
//                     rows={7}
//                     value={
//                       form.terms_and_conditions
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "terms_and_conditions",
//                         e.target.value
//                       )
//                     }
//                     placeholder="Enter package terms and conditions..."
//                     className={
//                       TEXTAREA_CLASS
//                     }
//                   />
//                 </section>

//                 {/* =================================================
//                     CANCELLATION
//                 ================================================== */}

//                 <section className="border-t border-border pt-7">

//                   <div className="mb-3">
//                     <h3 className="font-display text-xl font-semibold text-ink-800">
//                       Cancellation Policy
//                     </h3>

//                     <p className="mt-1 text-xs text-ink-500">
//                       Explain cancellation and
//                       refund rules for this package.
//                     </p>
//                   </div>

//                   <textarea
//                     rows={7}
//                     value={
//                       form.cancellation_policy
//                     }
//                     onChange={(e) =>
//                       updateField(
//                         "cancellation_policy",
//                         e.target.value
//                       )
//                     }
//                     placeholder="Enter cancellation policy..."
//                     className={
//                       TEXTAREA_CLASS
//                     }
//                   />
//                 </section>

//                 {/* =================================================
//                     ERROR
//                 ================================================== */}

//                 {error && (
//                   <div className="flex items-start gap-3 rounded-2xl border border-error/20 bg-error-bg px-4 py-3.5 text-sm text-error-text">
//                     <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
//                       !
//                     </span>

//                     <p className="whitespace-pre-line leading-6">
//                       {error}
//                     </p>
//                   </div>
//                 )}

//               </div>

//               {/* =================================================
//                   FOOTER ACTIONS
//               ================================================== */}

//               <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">

//                 <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">

//                   <button
//                     type="button"
//                     onClick={
//                       closeModal
//                     }
//                     disabled={saving}
//                     className="w-full rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-600 transition-colors hover:bg-surface disabled:opacity-50 sm:w-auto"
//                   >
//                     Cancel
//                   </button>

//                   <button
//                     type="submit"
//                     disabled={saving}
//                     className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-brand transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
//                   >
//                     {saving && (
//                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
//                     )}

//                     {saving
//                       ? "Saving..."
//                       : editing?.id
//                       ? "Update Package"
//                       : "Save Package"}
//                   </button>

//                 </div>
//               </div>

//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



//------------------------------------------------------------------------------------------------


// import { useEffect, useState } from "react";
// import {
//   getAllPackagesAdmin,
//   createPackage,
//   updatePackage,
//   deletePackage,
// } from "../../api/adminPackages";
// import ImageUploadField from "../../components/admin/ImageUploadField";
// import api from "../../api/axios";

// const PACKAGE_TYPES = [
//   { value: "pilgrimage", label: "Pilgrimage" },
//   { value: "mountains_adventure", label: "Mountains & Adventure" },
//   { value: "romantic", label: "Romantic" },
//   { value: "international", label: "International" },
//   { value: "beach", label: "Beach" },
//   { value: "family", label: "Family" },
//   { value: "wildlife_nature", label: "Wildlife & Nature" },
// ];

// const DISCOVERY_OPTIONS = [
//   { key: "is_popular", label: "Popular", description: "Show in Popular Packages" },
//   { key: "is_recommended", label: "Recommended", description: "Show in Recommended Packages" },
//   { key: "is_trending", label: "Trending", description: "Show in Trending Packages" },
//   { key: "is_featured", label: "Featured", description: "Show in Featured Packages" },
//   { key: "is_new", label: "New", description: "Show in New Packages" },
//   { key: "is_most_visited", label: "Most Visited", description: "Show in Most Visited Packages" },
// ];

// // =========================================================
// // LIST TEXT HELPERS
// // Facilities / Inclusions / Exclusions are entered as free text
// // (one per line, or comma separated) and stored as an array of
// // trimmed, non-empty strings.
// // =========================================================
// const parseListText = (text) =>
//   (text || "")
//     .split(/[\n,]+/)
//     .map((item) => item.trim())
//     .filter(Boolean);

// const listToText = (list) => (Array.isArray(list) ? list.join("\n") : "");

// const EMPTY_FORM = {
//   title: "",
//   destination: "",
//   destination_id: "",

//   //optional relationship
//   seasoned_destination_id: "",

//   package_type: "family",
//   display_order: "",
//   price: "",
//   duration_days: "",
//   duration_nights: "",
//   description: "",
//   status: "draft",
//   // Discovery / visibility
//   is_popular: false,
//   is_recommended: false,
//   is_trending: false,
//   is_featured: false,
//   is_new: false,
//   is_most_visited: false,
//   images: [],
//   itinerary: [],
//   // Stored as plain text in the form; split into arrays on save.
//   facilities: "",
//   inclusions: "",
//   exclusions: "",
//   terms_and_conditions: "",
//   cancellation_policy: "",
// };

// export default function PackagesManage() {
//   const [packages, setPackages] = useState([]);
//   const [destinations, setDestinations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [destinationsLoading, setDestinationsLoading] = useState(true);
//   const [seasonedDestinations, setSeasonedDestinations] = useState([]);
//   const [seasonedDestinationsLoading, setSeasonedDestinationsLoading] =useState(true);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   // =========================================================
//   // LOAD PACKAGES
//   // =========================================================
//   const load = async () => {
//     try {
//       setLoading(true);
//       const data = await getAllPackagesAdmin();
//       setPackages(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to load packages:", err);
//       setError(err?.response?.data?.detail || "Could not load packages");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   // =========================================================
//   // LOAD MOST VISITED DESTINATIONS
//   // =========================================================
//   const loadDestinations = async () => {
//     try {
//       setDestinationsLoading(true);
//       const response = await api.get("/most-visited");
//       const data = response?.data;
//       const items = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.items)
//         ? data.items
//         : Array.isArray(data?.data)
//         ? data.data
//         : [];
//       setDestinations(items);
//     } catch (err) {
//       console.error("Failed to load destinations:", err);
//       setDestinations([]);
//       setError(err?.message || "Could not load Most Visited destinations");
//     } finally {
//       setDestinationsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDestinations();
//   }, []);

//   // =========================================================
// // LOAD SEASONED DESTINATIONS
// // =========================================================

// const loadSeasonedDestinations = async () => {
//   try {
//     setSeasonedDestinationsLoading(true);

//     const response = await api.get("/seasoned-destinations");

//     const data = response?.data;

//     const items = Array.isArray(data)
//       ? data
//       : Array.isArray(data?.items)
//       ? data.items
//       : Array.isArray(data?.data)
//       ? data.data
//       : [];

//     setSeasonedDestinations(items);
//   } catch (err) {
//     console.error("Failed to load seasoned destinations:", err);

//     setSeasonedDestinations([]);

//     setError(
//       err?.response?.data?.detail ||
//         err?.message ||
//         "Could not load Seasoned Destinations"
//     );
//   } finally {
//     setSeasonedDestinationsLoading(false);
//   }
// };

// useEffect(() => {
//   loadSeasonedDestinations();
// }, []);

//   // =========================================================
//   // FORM HELPERS
//   // =========================================================
//   const updateField = (field, value) => {
//     setForm((current) => ({
//       ...current,
//       [field]: value,
//     }));
//   };

//   const toggleDiscovery = (field) => {
//     setForm((current) => ({
//       ...current,
//       [field]: !current[field],
//     }));
//   };

//   // =========================================================
//   // OPEN CREATE
//   // =========================================================
//   const openCreate = () => {
//     setForm({
//       ...EMPTY_FORM,
//       images: [],
//       itinerary: [],
//       facilities: "",
//       inclusions: "",
//       exclusions: "",
//     });
//     setError("");
//     setEditing({});
//   };

//   // =========================================================
//   // OPEN EDIT
//   // =========================================================
//   const openEdit = (pkg) => {
//     setForm({
//       title: pkg?.title || "",
//       destination: pkg?.destination_obj?.place_name || pkg?.destination || "",
//       destination_id: pkg?.destination_id ?? pkg?.destination_obj?.id ?? "",
//       seasoned_destination_id:
//       pkg?.seasoned_destination_id ??
//       pkg?.seasoned_destination_obj?.id ??
//       "",
//       package_type: pkg?.package_type || "family",
//       display_order: pkg?.display_order ?? 1,
//       price: pkg?.price ?? "",
//       duration_days: pkg?.duration_days ?? "",
//       duration_nights:
//         pkg?.duration_nights ??
//         ((Number(pkg?.duration_days) || 0) > 0
//           ? Math.max(Number(pkg.duration_days) - 1, 0)
//           : ""),
//       description: pkg?.description || "",
//       status: pkg?.status || "draft",
//       is_popular: Boolean(pkg?.is_popular),
//       is_recommended: Boolean(pkg?.is_recommended),
//       is_trending: Boolean(pkg?.is_trending),
//       is_featured: Boolean(pkg?.is_featured),
//       is_new: Boolean(pkg?.is_new),
//       is_most_visited: Boolean(pkg?.is_most_visited),
//       images: Array.isArray(pkg?.images) ? pkg.images : [],
//       // Day title + description (paragraph) + optional image — no bullet splitting.
//       itinerary: Array.isArray(pkg?.itinerary)
//         ? pkg.itinerary.map((item, index) => ({
//             day: index + 1,
//             title: item?.title || "",
//             description: item?.description || "",
//             image:
//               typeof item?.image === "string"
//                 ? item.image
//                 : item?.image?.url || null,
//           }))
//         : [],
//       // Arrays come back from the API; show them as one-per-line text.
//       facilities: listToText(pkg?.facilities),
//       inclusions: listToText(pkg?.inclusions),
//       exclusions: listToText(pkg?.exclusions),
//       terms_and_conditions: pkg?.terms_and_conditions || "",
//       cancellation_policy: pkg?.cancellation_policy || "",
//     });
//     setError("");
//     setEditing(pkg);
//   };

//   // =========================================================
//   // LEGACY DESTINATION FALLBACK
//   // =========================================================
//   useEffect(() => {
//     if (form.destination_id !== "" && form.destination_id != null) {
//       return;
//     }
//     if (!form.destination || destinations.length === 0) {
//       return;
//     }
//     const normalized = String(form.destination).trim().toLowerCase();
//     const match = destinations.find((destination) => {
//       const name = destination?.place_name || destination?.name || "";
//       return String(name).trim().toLowerCase() === normalized;
//     });
//     if (match?.id) {
//       setForm((current) => ({
//         ...current,
//         destination_id: Number(match.id),
//         destination: match.place_name || match.name || current.destination,
//       }));
//     }
//   }, [destinations, form.destination, form.destination_id]);

//   // =========================================================
//   // ITINERARY (title + paragraph description + optional image)
//   // =========================================================
//   const addItineraryDay = () => {
//     setForm((current) => ({
//       ...current,
//       itinerary: [
//         ...current.itinerary,
//         {
//           day: current.itinerary.length + 1,
//           title: "",
//           description: "",
//           image: null,
//         },
//       ],
//     }));
//   };

//   const updateItineraryDay = (index, field, value) => {
//     setForm((current) => ({
//       ...current,
//       itinerary: current.itinerary.map((item, i) =>
//         i === index ? { ...item, [field]: value } : item
//       ),
//     }));
//   };

//   const removeItineraryDay = (index) => {
//     setForm((current) => ({
//       ...current,
//       itinerary: current.itinerary
//         .filter((_, i) => i !== index)
//         .map((item, i) => ({ ...item, day: i + 1 })),
//     }));
//   };

//   const addItineraryImage = (index, img) => {
//     if (!img?.url) return;
//     setForm((current) => ({
//       ...current,
//       itinerary: current.itinerary.map((item, i) =>
//         i === index ? { ...item, image: img.url } : item
//       ),
//     }));
//   };

//   const removeItineraryImage = (index) => {
//     setForm((current) => ({
//       ...current,
//       itinerary: current.itinerary.map((item, i) =>
//         i === index ? { ...item, image: null } : item
//       ),
//     }));
//   };

//   // =========================================================
//   // PACKAGE IMAGES
//   // =========================================================
//   const addImage = (img) => {
//     if (!img?.url) return;
//     setForm((current) => ({
//       ...current,
//       images: [...current.images, img],
//     }));
//   };

//   const removeImage = (index) => {
//     setForm((current) => ({
//       ...current,
//       images: current.images.filter((_, i) => i !== index),
//     }));
//   };

//   // =========================================================
//   // SAVE PACKAGE
//   // =========================================================
//   const handleSave = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     setError("");
//     try {
//       if (!Number(form.destination_id)) {
//         setError("Please select a destination from the Most Visited destinations.");
//         setSaving(false);
//         return;
//       }
//       if (!Number(form.duration_days) || Number(form.duration_days) < 1) {
//         setError("Duration (days) must be at least 1.");
//         setSaving(false);
//         return;
//       }

//       const payload = {
//         title: form.title.trim(),
//         destination: form.destination.trim(),
//         destination_id: Number(form.destination_id),
//         seasoned_destination_id:
//         form.seasoned_destination_id === "" ||
//         form.seasoned_destination_id == null
//           ? null
//           : Number(form.seasoned_destination_id),

//         package_type: form.package_type,
//         display_order: Number(form.display_order) || 0,
//         price: Number(form.price),
//         duration_days: Number(form.duration_days),
//         duration_nights: Number(
//           form.duration_nights || Math.max(Number(form.duration_days) - 1, 0)
//         ),
//         description: form.description.trim() || null,
//         status: form.status,
//         is_popular: Boolean(form.is_popular),
//         is_recommended: Boolean(form.is_recommended),
//         is_trending: Boolean(form.is_trending),
//         is_featured: Boolean(form.is_featured),
//         is_new: Boolean(form.is_new),
//         is_most_visited: Boolean(form.is_most_visited),
//         images: form.images
//           .filter((img) => img?.url)
//           .map((img) => ({
//             url: img.url,
//             ...(img.public_id ? { public_id: img.public_id } : {}),
//           })),
//         // Paragraph description per day — stored as-is, no splitting.
//         itinerary: form.itinerary.map((item, index) => ({
//           day: index + 1,
//           title: item?.title?.trim() || "",
//           description: item?.description?.trim() || "",
//           image: item?.image || null,
//         })),
//         // Free text -> array of points (one per line or comma separated).
//         facilities: parseListText(form.facilities),
//         inclusions: parseListText(form.inclusions),
//         exclusions: parseListText(form.exclusions),
//         terms_and_conditions: form.terms_and_conditions.trim() || null,
//         cancellation_policy: form.cancellation_policy.trim() || null,
//       };

//       console.log("Saving package:", payload);

//       if (editing?.id) {
//         await updatePackage(editing.id, payload);
//       } else {
//         await createPackage(payload);
//       }
//       setEditing(null);
//       await load();
//     } catch (error) {
//       console.error("Package save failed:", error);
//       const detail = error?.response?.data?.detail;
//       let message = "Failed to save package.";
//       if (Array.isArray(detail)) {
//         message = detail
//           .map((item) => {
//             const field = Array.isArray(item.loc)
//               ? item.loc.filter((part) => part !== "body").join(".")
//               : "";
//             return field ? `${field}: ${item.msg}` : item.msg || "Validation error";
//           })
//           .join("\n");
//       } else if (typeof detail === "string") {
//         message = detail;
//       } else if (error?.message) {
//         message = error.message;
//       }
//       setError(message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // =========================================================
//   // DELETE
//   // =========================================================
//   const handleDelete = async (id) => {
//     if (!confirm("Delete this package? This also removes its images.")) {
//       return;
//     }
//     try {
//       await deletePackage(id);
//       await load();
//     } catch (err) {
//       console.error("Package delete failed:", err);
//       setError(err?.response?.data?.detail || "Could not delete package");
//     }
//   };

//   // =========================================================
//   // RENDER
//   // =========================================================
//   return (
//     <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
//       {/* =====================================================
//           PAGE HEADER
//       ====================================================== */}
//       <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-semibold text-navy">Packages</h1>
//           <p className="text-sm text-navy/50 mt-1">
//             Manage packages, destinations and discovery sections.
//           </p>
//         </div>
//         <button
//           type="button"
//           onClick={openCreate}
//           className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
//         >
//           + New Package
//         </button>
//       </div>

//       {/* =====================================================
//           ERROR
//       ====================================================== */}
//       {error && !editing && (
//         <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
//           {error}
//         </div>
//       )}

//       {/* =====================================================
//           PACKAGE TABLE
//       ====================================================== */}
//       {loading ? (
//         <p className="text-navy/50 text-sm">Loading…</p>
//       ) : (
//         <div className="bg-white rounded-xl border border-navy/10 overflow-hidden">
//           <div className="w-full overflow-x-auto">
//             <table className="w-full min-w-[950px] text-sm">
//               <thead className="bg-surface text-navy/60 text-xs uppercase tracking-wide">
//                 <tr>
//                   <th className="text-left px-4 sm:px-5 py-3">Title</th>
//                   <th className="text-left px-4 sm:px-5 py-3">Destination</th>
//                   <th className="text-left px-4 sm:px-5 py-3">Type</th>
//                   <th className="text-left px-4 sm:px-5 py-3">Price</th>
//                   <th className="text-left px-4 sm:px-5 py-3">Discovery</th>
//                   <th className="text-left px-4 sm:px-5 py-3">Status</th>
//                   <th className="text-right px-4 sm:px-5 py-3">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {packages.map((pkg) => (
//                   <tr key={pkg.id} className="border-t border-navy/5">
//                     <td className="px-4 sm:px-5 py-3 font-medium text-navy max-w-[220px] break-words">
//                       {pkg.title}
//                     </td>
//                     <td className="px-4 sm:px-5 py-3 text-navy/70 max-w-[160px] break-words">
//                       {pkg.destination}
//                     </td>
//                     <td className="px-4 sm:px-5 py-3">
//                       <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-surface-blue text-navy">
//                         {PACKAGE_TYPES.find((type) => type.value === pkg.package_type)?.label ||
//                           pkg.package_type ||
//                           "Family"}
//                       </span>
//                     </td>
//                     <td className="px-4 sm:px-5 py-3 text-navy/70 whitespace-nowrap">
//                       ₹{Number(pkg.price).toLocaleString("en-IN")}
//                     </td>
//                     <td className="px-4 sm:px-5 py-3">
//                       <div className="flex flex-wrap gap-1.5 max-w-[260px]">
//                         {pkg.is_popular && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-700">
//                             Popular
//                           </span>
//                         )}
//                         {pkg.is_recommended && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
//                             Recommended
//                           </span>
//                         )}
//                         {pkg.is_trending && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">
//                             Trending
//                           </span>
//                         )}
//                         {pkg.is_featured && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
//                             Featured
//                           </span>
//                         )}
//                         {pkg.is_new && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
//                             New
//                           </span>
//                         )}
//                         {pkg.is_most_visited && (
//                           <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-navy/10 text-navy">
//                             Most Visited
//                           </span>
//                         )}
//                         {!pkg.is_popular &&
//                           !pkg.is_recommended &&
//                           !pkg.is_trending &&
//                           !pkg.is_featured &&
//                           !pkg.is_new &&
//                           !pkg.is_most_visited && (
//                             <span className="text-xs text-navy/40">No discovery labels</span>
//                           )}
//                       </div>
//                     </td>
//                     <td className="px-4 sm:px-5 py-3">
//                       <span
//                         className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
//                           pkg.status === "published"
//                             ? "bg-green-100 text-green-700"
//                             : "bg-surface text-navy/60"
//                         }`}
//                       >
//                         {pkg.status}
//                       </span>
//                     </td>
//                     <td className="px-4 sm:px-5 py-3 text-right">
//                       <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center sm:gap-3">
//                         <button
//                           type="button"
//                           onClick={() => openEdit(pkg)}
//                           className="text-secondary font-medium hover:underline"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleDelete(pkg.id)}
//                           className="text-red-600 font-medium hover:underline"
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {packages.length === 0 && (
//                   <tr>
//                     <td colSpan={7} className="px-5 py-8 text-center text-navy/40">
//                       No packages yet.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           CREATE / EDIT MODAL
//       ====================================================== */}
//       {editing !== null && (
//         <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
//           <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-3xl h-[96vh] overflow-y-auto">
//             <div className="sticky top-0 z-20 bg-ivory px-4 sm:px-6 py-4 sm:py-5 border-b border-navy/10">
//               <h2 className="font-display text-lg sm:text-xl font-semibold text-navy">
//                 {editing?.id ? "Edit Package" : "New Package"}
//               </h2>
//               <p className="text-xs text-navy/50 mt-1">
//                 Control package content, publishing and where it appears across the website.
//               </p>
//             </div>

//             <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
//               {/* =================================================
//                   BASIC DETAILS
//               ================================================== */}
//               <div>
//                 <h3 className="text-base font-semibold text-navy mb-4">Basic Package Details</h3>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div className="sm:col-span-2">
//                     <label className="block text-sm font-medium text-navy mb-1.5">Title</label>
//                     <input
//                       required
//                       value={form.title}
//                       onChange={(e) => updateField("title", e.target.value)}
//                       placeholder="Example: Kerala 5 Days Package"
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Destination
//                     </label>
//                     <select
//                       required
//                       value={form.destination_id}
//                       disabled={destinationsLoading}
//                       onChange={(e) => {
//                         const selectedId = Number(e.target.value);
//                         const selected = destinations.find(
//                           (destination) => Number(destination?.id) === selectedId
//                         );
//                         setForm((current) => ({
//                           ...current,
//                           destination_id: selectedId || "",
//                           destination: selected?.place_name || selected?.name || "",
//                         }));
//                       }}
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white disabled:bg-surface disabled:cursor-not-allowed"
//                     >
//                       <option value="">
//                         {destinationsLoading ? "Loading destinations..." : "Select destination"}
//                       </option>
//                       {destinations.map((destination) => (
//                         <option key={destination.id} value={destination.id}>
//                           {destination.place_name || destination.name}
//                         </option>
//                       ))}
//                     </select>
//                     <p className="text-xs text-navy/40 mt-1">
//                       Select your desired destination .
//                     </p>
//                   </div>


//                                   <div>
//                   <label className="block text-sm font-medium text-navy mb-1.5">
//                     Seasoned Destination
//                   </label>

//                   <select
//                     value={form.seasoned_destination_id}
//                     disabled={seasonedDestinationsLoading}
//                     onChange={(e) => {
//                       const selectedId = Number(e.target.value);

//                       setForm((current) => ({
//                         ...current,
//                         seasoned_destination_id: selectedId || "",
//                       }));
//                     }}
//                     className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white disabled:bg-surface disabled:cursor-not-allowed"
//                   >
//                     <option value="">
//                       {seasonedDestinationsLoading
//                         ? "Loading seasonal destinations..."
//                         : "No seasonal destination"}
//                     </option>

//                     {seasonedDestinations.map((destination) => (
//                       <option
//                         key={destination.id}
//                         value={destination.id}
//                       >
//                         {destination.place_name}
//                         {destination.season_label
//                           ? ` — ${destination.season_label}`
//                           : ""}
//                       </option>
//                     ))}
//                   </select>

//                   <p className="text-xs text-navy/40 mt-1">
//                     Optional. Associate this package with a seasonal destination.
//                   </p>
//                 </div>


//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Package Type
//                     </label>
//                     <select
//                       value={form.package_type}
//                       onChange={(e) => updateField("package_type", e.target.value)}
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
//                     >
//                       {PACKAGE_TYPES.map((type) => (
//                         <option key={type.value} value={type.value}>
//                           {type.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Display Order
//                     </label>
//                     <input
//                       type="number"
//                       min="1"
//                       value={form.display_order}
//                       onChange={(e) => updateField("display_order", e.target.value)}
//                       placeholder="0"
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
//                     />
//                     <p className="text-xs text-navy/40 mt-1">Lower numbers appear first.</p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Duration (days)
//                     </label>
//                     <input
//                       type="number"
//                       required
//                       min="1"
//                       value={form.duration_days}
//                       onChange={(e) => updateField("duration_days", e.target.value)}
//                       placeholder="5"
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Duration (nights)
//                     </label>
//                     <input
//                       type="number"
//                       required
//                       min="0"
//                       value={form.duration_nights}
//                       onChange={(e) => updateField("duration_nights", e.target.value)}
//                       placeholder="4"
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
//                     />
//                     <p className="text-xs text-navy/40 mt-1">
//                       Usually days minus 1. Example: 5 days = 4 nights.
//                     </p>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">
//                       Price (₹)
//                     </label>
//                     <input
//                       type="number"
//                       required
//                       min="1"
//                       step="0.01"
//                       value={form.price}
//                       onChange={(e) => updateField("price", e.target.value)}
//                       placeholder="25000"
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-navy mb-1.5">Status</label>
//                     <select
//                       value={form.status}
//                       onChange={(e) => updateField("status", e.target.value)}
//                       className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
//                     >
//                       <option value="draft">Draft</option>
//                       <option value="published">Published</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* =================================================
//                   PACKAGE DISCOVERY
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <div className="mb-4">
//                   <h3 className="text-base font-semibold text-navy">Package Discovery</h3>
//                   <p className="text-xs text-navy/50 mt-1">
//                     Choose the sections where this package should appear on the website. A
//                     package can appear in multiple sections.
//                   </p>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   {DISCOVERY_OPTIONS.map((option) => {
//                     const checked = Boolean(form[option.key]);
//                     return (
//                       <label
//                         key={option.key}
//                         className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors ${
//                           checked
//                             ? "border-accent/50 bg-surface-orange"
//                             : "border-navy/10 bg-white hover:bg-surface"
//                         }`}
//                       >
//                         <input
//                           type="checkbox"
//                           checked={checked}
//                           onChange={() => toggleDiscovery(option.key)}
//                           className="mt-0.5 h-4 w-4 rounded border-navy/30 text-accent focus:ring-accent"
//                         />
//                         <span className="min-w-0">
//                           <span className="block text-sm font-semibold text-navy">
//                             {option.label}
//                           </span>
//                           <span className="block text-xs text-navy/50 mt-0.5">
//                             {option.description}
//                           </span>
//                         </span>
//                       </label>
//                     );
//                   })}
//                 </div>
//                 <div className="mt-4 rounded-xl bg-surface border border-navy/5 p-3">
//                   <p className="text-xs font-semibold text-navy mb-2">Current discovery labels</p>
//                   <div className="flex flex-wrap gap-2">
//                     {DISCOVERY_OPTIONS.filter((option) => form[option.key]).map((option) => (
//                       <span
//                         key={option.key}
//                         className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-navy/10 text-navy"
//                       >
//                         {option.label}
//                       </span>
//                     ))}
//                     {DISCOVERY_OPTIONS.every((option) => !form[option.key]) && (
//                       <span className="text-xs text-navy/40">No discovery sections selected.</span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* =================================================
//                   DESCRIPTION
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
//                 <textarea
//                   rows={5}
//                   value={form.description}
//                   onChange={(e) => updateField("description", e.target.value)}
//                   placeholder="Describe the package..."
//                   className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//               </div>

//               {/* =================================================
//                   ITINERARY — title, image, paragraph description
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <label className="block text-sm font-semibold text-navy">Itinerary</label>
//                     <p className="text-xs text-navy/50 mt-1">
//                       Add a title, a full paragraph description, and an image for every day of
//                       the trip.
//                     </p>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={addItineraryDay}
//                     className="w-full sm:w-auto bg-navy text-ivory text-sm font-semibold px-3 py-2.5 rounded-lg hover:bg-navy-light"
//                   >
//                     + Add Day
//                   </button>
//                 </div>

//                 {form.itinerary.length === 0 && (
//                   <div className="border border-dashed border-navy/20 rounded-xl p-5 text-center">
//                     <p className="text-sm text-navy/50">No itinerary days added yet.</p>
//                     <p className="text-xs text-navy/40 mt-1">Click "+ Add Day" to create Day 1.</p>
//                   </div>
//                 )}

//                 <div className="space-y-5">
//                   {form.itinerary.map((item, index) => (
//                     <div
//                       key={index}
//                       className="border border-navy/10 bg-white rounded-xl overflow-hidden"
//                     >
//                       <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-surface border-b border-navy/10">
//                         <div className="flex items-center gap-3">
//                           <div className="shrink-0 w-9 h-9 rounded-full bg-navy text-ivory text-sm font-semibold flex items-center justify-center">
//                             {index + 1}
//                           </div>
//                           <div>
//                             <p className="text-sm font-semibold text-navy">Day {index + 1}</p>
//                             <p className="text-xs text-navy/40">
//                               Day {index + 1} itinerary details
//                             </p>
//                           </div>
//                         </div>
//                         <button
//                           type="button"
//                           onClick={() => removeItineraryDay(index)}
//                           className="text-red-600 text-xs font-medium hover:underline"
//                         >
//                           Remove
//                         </button>
//                       </div>

//                       <div className="p-3 sm:p-4">
//                         <div className="mb-4">
//                           <label className="block text-xs font-semibold text-navy mb-1.5">
//                             Day {index + 1} Title
//                           </label>
//                           <input
//                             required
//                             value={item?.title || ""}
//                             onChange={(e) =>
//                               updateItineraryDay(index, "title", e.target.value)
//                             }
//                             placeholder="Example: Arrival in Kochi & Local Sightseeing"
//                             className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
//                           />
//                         </div>

//                         <div className="mb-4">
//                           <label className="block text-xs font-semibold text-navy mb-1.5">
//                             Day {index + 1} Description 
//                           </label>
//                           <textarea
//                             required
//                             rows={4}
//                             value={item?.description || ""}
//                             onChange={(e) =>
//                               updateItineraryDay(index, "description", e.target.value)
//                             }
//                             placeholder="Description"
//                             className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/20"
//                           />
//                         </div>

//                         <div>
//                           <div className="flex items-center justify-between mb-2">
//                             <label className="block text-sm font-semibold text-navy">
//                               Day {index + 1} Image
//                             </label>
//                             {item?.image && (
//                               <span className="text-xs text-green-600 font-medium">
//                                 Image added
//                               </span>
//                             )}
//                           </div>

//                           {item?.image ? (
//                             <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden border border-navy/15 bg-surface">
//                               <img
//                                 src={item.image}
//                                 alt={item?.title || `Day ${index + 1}`}
//                                 className="w-full h-full object-cover"
//                               />
//                               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
//                                 <p className="text-white text-xs font-semibold">
//                                   Day {index + 1}
//                                 </p>
//                                 {item?.title && (
//                                   <p className="text-white text-sm font-medium truncate">
//                                     {item.title}
//                                   </p>
//                                 )}
//                               </div>
//                               <button
//                                 type="button"
//                                 onClick={() => removeItineraryImage(index)}
//                                 className="absolute top-2 right-2 bg-navy-dark/80 hover:bg-navy-dark text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors"
//                                 aria-label={`Remove Day ${index + 1} image`}
//                               >
//                                 ✕
//                               </button>
//                             </div>
//                           ) : (
//                             <div className="w-full">
//                               <ImageUploadField
//                                 value={null}
//                                 onChange={(img) => addItineraryImage(index, img)}
//                                 label=""
//                               />
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {form.itinerary.length > 0 && (
//                   <button
//                     type="button"
//                     onClick={addItineraryDay}
//                     className="w-full mt-4 border border-dashed border-navy/20 rounded-lg py-2.5 text-sm font-medium text-secondary hover:bg-surface"
//                   >
//                     + Add Day {form.itinerary.length + 1}
//                   </button>
//                 )}
//               </div>

//               {/* =================================================
//                   PACKAGE IMAGES
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <label className="block text-sm font-semibold text-navy mb-2">
//                   Package Images
//                 </label>
//                 <p className="text-xs text-navy/50 mb-3">
//                   Add main images 
//                 </p>
//                 <div className="flex flex-wrap gap-3">
//                   {form.images.map((img, index) => (
//                     <div
//                       key={index}
//                       className="relative w-24 h-24 rounded-lg overflow-hidden border border-navy/15 shrink-0"
//                     >
//                       <img src={img?.url} alt="" className="w-full h-full object-cover" />
//                       <button
//                         type="button"
//                         onClick={() => removeImage(index)}
//                         className="absolute top-1 right-1 bg-navy-dark/70 text-ivory rounded-full w-6 h-6 text-xs flex items-center justify-center"
//                       >
//                         ✕
//                       </button>
//                     </div>
//                   ))}
//                   <div className="w-24 h-24 shrink-0">
//                     <ImageUploadField value={null} onChange={addImage} label="" />
//                   </div>
//                 </div>
//               </div>

//               {/* =================================================
//                   FACILITIES — one per line / comma separated -> points
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <div className="mb-3">
//                   <h3 className="text-sm font-semibold text-navy">Facilities</h3>
//                 </div>
//                 <textarea
//                   rows={4}
//                   value={form.facilities}
//                   onChange={(e) => updateField("facilities", e.target.value)}
//                   placeholder={"Ex:Hotel accommodation"}
//                   className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//                 {parseListText(form.facilities).length > 0 && (
//                   <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
//                     {parseListText(form.facilities).map((item, index) => (
//                       <li key={index}>{item}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* =================================================
//                   INCLUSIONS — one per line / comma separated -> points
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <div className="mb-3">
//                   <h3 className="text-sm font-semibold text-navy">Inclusions</h3>
//                 </div>
//                 <textarea
//                   rows={4}
//                   value={form.inclusions}
//                   onChange={(e) => updateField("inclusions", e.target.value)}
//                   placeholder={"Ex: 4 nights hotel accommodation"}
//                   className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//                 {parseListText(form.inclusions).length > 0 && (
//                   <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
//                     {parseListText(form.inclusions).map((item, index) => (
//                       <li key={index}>{item}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* =================================================
//                   EXCLUSIONS — one per line / comma separated -> points
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <div className="mb-3">
//                   <h3 className="text-sm font-semibold text-navy">Exclusions</h3>
//                 </div>
//                 <textarea
//                   rows={4}
//                   value={form.exclusions}
//                   onChange={(e) => updateField("exclusions", e.target.value)}
//                   placeholder={"Ex:Flight tickets"}
//                   className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//                 {parseListText(form.exclusions).length > 0 && (
//                   <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
//                     {parseListText(form.exclusions).map((item, index) => (
//                       <li key={index}>{item}</li>
//                     ))}
//                   </ul>
//                 )}
//               </div>

//               {/* =================================================
//                   TERMS & CONDITIONS
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <label className="block text-sm font-semibold text-navy mb-1.5">
//                   Terms & Conditions
//                 </label>
//                 <textarea
//                   rows={6}
//                   value={form.terms_and_conditions}
//                   onChange={(e) => updateField("terms_and_conditions", e.target.value)}
//                   placeholder="Enter package terms and conditions..."
//                   className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//               </div>

//               {/* =================================================
//                   CANCELLATION POLICY
//               ================================================== */}
//               <div className="border-t border-navy/10 pt-5">
//                 <label className="block text-sm font-semibold text-navy mb-1.5">
//                   Cancellation Policy
//                 </label>
//                 <textarea
//                   rows={6}
//                   value={form.cancellation_policy}
//                   onChange={(e) => updateField("cancellation_policy", e.target.value)}
//                   placeholder="Enter cancellation policy..."
//                   className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
//                 />
//               </div>

//               {/* =================================================
//                   ERROR
//               ================================================== */}
//               {error && (
//                 <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
//                   {error}
//                 </div>
//               )}

//               {/* =================================================
//                   ACTION BUTTONS
//               ================================================== */}
//               <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setEditing(null)}
//                   className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
//                 >
//                   {saving ? "Saving…" : editing?.id ? "Update Package" : "Save Package"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






