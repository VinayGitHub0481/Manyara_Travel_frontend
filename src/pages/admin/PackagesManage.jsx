
import { useEffect, useState } from "react";
import {
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
} from "../../api/adminPackages";
import ImageUploadField from "../../components/admin/ImageUploadField";
import api from "../../api/axios";

const PACKAGE_TYPES = [
  { value: "pilgrimage", label: "Pilgrimage" },
  { value: "mountains_adventure", label: "Mountains & Adventure" },
  { value: "romantic", label: "Romantic" },
  { value: "international", label: "International" },
  { value: "beach", label: "Beach" },
  { value: "family", label: "Family" },
  { value: "wildlife_nature", label: "Wildlife & Nature" },
];

const DISCOVERY_OPTIONS = [
  { key: "is_popular", label: "Popular", description: "Show in Popular Packages" },
  { key: "is_recommended", label: "Recommended", description: "Show in Recommended Packages" },
  { key: "is_trending", label: "Trending", description: "Show in Trending Packages" },
  { key: "is_featured", label: "Featured", description: "Show in Featured Packages" },
  { key: "is_new", label: "New", description: "Show in New Packages" },
  { key: "is_most_visited", label: "Most Visited", description: "Show in Most Visited Packages" },
];

// =========================================================
// LIST TEXT HELPERS
// Facilities / Inclusions / Exclusions are entered as free text
// (one per line, or comma separated) and stored as an array of
// trimmed, non-empty strings.
// =========================================================
const parseListText = (text) =>
  (text || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const listToText = (list) => (Array.isArray(list) ? list.join("\n") : "");

const EMPTY_FORM = {
  title: "",
  destination: "",
  destination_id: "",
  package_type: "family",
  display_order: "",
  price: "",
  duration_days: "",
  duration_nights: "",
  description: "",
  status: "draft",
  // Discovery / visibility
  is_popular: false,
  is_recommended: false,
  is_trending: false,
  is_featured: false,
  is_new: false,
  is_most_visited: false,
  images: [],
  itinerary: [],
  // Stored as plain text in the form; split into arrays on save.
  facilities: "",
  inclusions: "",
  exclusions: "",
  terms_and_conditions: "",
  cancellation_policy: "",
};

export default function PackagesManage() {
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD PACKAGES
  // =========================================================
  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllPackagesAdmin();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load packages:", err);
      setError(err?.response?.data?.detail || "Could not load packages");
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
      const response = await api.get("/most-visited");
      const data = response?.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setDestinations(items);
    } catch (err) {
      console.error("Failed to load destinations:", err);
      setDestinations([]);
      setError(err?.message || "Could not load Most Visited destinations");
    } finally {
      setDestinationsLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
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
  // OPEN CREATE
  // =========================================================
  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      images: [],
      itinerary: [],
      facilities: "",
      inclusions: "",
      exclusions: "",
    });
    setError("");
    setEditing({});
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================
  const openEdit = (pkg) => {
    setForm({
      title: pkg?.title || "",
      destination: pkg?.destination_obj?.place_name || pkg?.destination || "",
      destination_id: pkg?.destination_id ?? pkg?.destination_obj?.id ?? "",
      package_type: pkg?.package_type || "family",
      display_order: pkg?.display_order ?? 1,
      price: pkg?.price ?? "",
      duration_days: pkg?.duration_days ?? "",
      duration_nights:
        pkg?.duration_nights ??
        ((Number(pkg?.duration_days) || 0) > 0
          ? Math.max(Number(pkg.duration_days) - 1, 0)
          : ""),
      description: pkg?.description || "",
      status: pkg?.status || "draft",
      is_popular: Boolean(pkg?.is_popular),
      is_recommended: Boolean(pkg?.is_recommended),
      is_trending: Boolean(pkg?.is_trending),
      is_featured: Boolean(pkg?.is_featured),
      is_new: Boolean(pkg?.is_new),
      is_most_visited: Boolean(pkg?.is_most_visited),
      images: Array.isArray(pkg?.images) ? pkg.images : [],
      // Day title + description (paragraph) + optional image — no bullet splitting.
      itinerary: Array.isArray(pkg?.itinerary)
        ? pkg.itinerary.map((item, index) => ({
            day: index + 1,
            title: item?.title || "",
            description: item?.description || "",
            image:
              typeof item?.image === "string"
                ? item.image
                : item?.image?.url || null,
          }))
        : [],
      // Arrays come back from the API; show them as one-per-line text.
      facilities: listToText(pkg?.facilities),
      inclusions: listToText(pkg?.inclusions),
      exclusions: listToText(pkg?.exclusions),
      terms_and_conditions: pkg?.terms_and_conditions || "",
      cancellation_policy: pkg?.cancellation_policy || "",
    });
    setError("");
    setEditing(pkg);
  };

  // =========================================================
  // LEGACY DESTINATION FALLBACK
  // =========================================================
  useEffect(() => {
    if (form.destination_id !== "" && form.destination_id != null) {
      return;
    }
    if (!form.destination || destinations.length === 0) {
      return;
    }
    const normalized = String(form.destination).trim().toLowerCase();
    const match = destinations.find((destination) => {
      const name = destination?.place_name || destination?.name || "";
      return String(name).trim().toLowerCase() === normalized;
    });
    if (match?.id) {
      setForm((current) => ({
        ...current,
        destination_id: Number(match.id),
        destination: match.place_name || match.name || current.destination,
      }));
    }
  }, [destinations, form.destination, form.destination_id]);

  // =========================================================
  // ITINERARY (title + paragraph description + optional image)
  // =========================================================
  const addItineraryDay = () => {
    setForm((current) => ({
      ...current,
      itinerary: [
        ...current.itinerary,
        {
          day: current.itinerary.length + 1,
          title: "",
          description: "",
          image: null,
        },
      ],
    }));
  };

  const updateItineraryDay = (index, field, value) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItineraryDay = (index) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, day: i + 1 })),
    }));
  };

  const addItineraryImage = (index, img) => {
    if (!img?.url) return;
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.map((item, i) =>
        i === index ? { ...item, image: img.url } : item
      ),
    }));
  };

  const removeItineraryImage = (index) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.map((item, i) =>
        i === index ? { ...item, image: null } : item
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
      images: [...current.images, img],
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
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
      if (!Number(form.destination_id)) {
        setError("Please select a destination from the Most Visited destinations.");
        setSaving(false);
        return;
      }
      if (!Number(form.duration_days) || Number(form.duration_days) < 1) {
        setError("Duration (days) must be at least 1.");
        setSaving(false);
        return;
      }

      const payload = {
        title: form.title.trim(),
        destination: form.destination.trim(),
        destination_id: Number(form.destination_id),
        package_type: form.package_type,
        display_order: Number(form.display_order) || 0,
        price: Number(form.price),
        duration_days: Number(form.duration_days),
        duration_nights: Number(
          form.duration_nights || Math.max(Number(form.duration_days) - 1, 0)
        ),
        description: form.description.trim() || null,
        status: form.status,
        is_popular: Boolean(form.is_popular),
        is_recommended: Boolean(form.is_recommended),
        is_trending: Boolean(form.is_trending),
        is_featured: Boolean(form.is_featured),
        is_new: Boolean(form.is_new),
        is_most_visited: Boolean(form.is_most_visited),
        images: form.images
          .filter((img) => img?.url)
          .map((img) => ({
            url: img.url,
            ...(img.public_id ? { public_id: img.public_id } : {}),
          })),
        // Paragraph description per day — stored as-is, no splitting.
        itinerary: form.itinerary.map((item, index) => ({
          day: index + 1,
          title: item?.title?.trim() || "",
          description: item?.description?.trim() || "",
          image: item?.image || null,
        })),
        // Free text -> array of points (one per line or comma separated).
        facilities: parseListText(form.facilities),
        inclusions: parseListText(form.inclusions),
        exclusions: parseListText(form.exclusions),
        terms_and_conditions: form.terms_and_conditions.trim() || null,
        cancellation_policy: form.cancellation_policy.trim() || null,
      };

      console.log("Saving package:", payload);

      if (editing?.id) {
        await updatePackage(editing.id, payload);
      } else {
        await createPackage(payload);
      }
      setEditing(null);
      await load();
    } catch (error) {
      console.error("Package save failed:", error);
      const detail = error?.response?.data?.detail;
      let message = "Failed to save package.";
      if (Array.isArray(detail)) {
        message = detail
          .map((item) => {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((part) => part !== "body").join(".")
              : "";
            return field ? `${field}: ${item.msg}` : item.msg || "Validation error";
          })
          .join("\n");
      } else if (typeof detail === "string") {
        message = detail;
      } else if (error?.message) {
        message = error.message;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (id) => {
    if (!confirm("Delete this package? This also removes its images.")) {
      return;
    }
    try {
      await deletePackage(id);
      await load();
    } catch (err) {
      console.error("Package delete failed:", err);
      setError(err?.response?.data?.detail || "Could not delete package");
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Packages</h1>
          <p className="text-sm text-navy/50 mt-1">
            Manage packages, destinations and discovery sections.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Package
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && !editing && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =====================================================
          PACKAGE TABLE
      ====================================================== */}
      {loading ? (
        <p className="text-navy/50 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-navy/10 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-surface text-navy/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 sm:px-5 py-3">Title</th>
                  <th className="text-left px-4 sm:px-5 py-3">Destination</th>
                  <th className="text-left px-4 sm:px-5 py-3">Type</th>
                  <th className="text-left px-4 sm:px-5 py-3">Price</th>
                  <th className="text-left px-4 sm:px-5 py-3">Discovery</th>
                  <th className="text-left px-4 sm:px-5 py-3">Status</th>
                  <th className="text-right px-4 sm:px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-t border-navy/5">
                    <td className="px-4 sm:px-5 py-3 font-medium text-navy max-w-[220px] break-words">
                      {pkg.title}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-navy/70 max-w-[160px] break-words">
                      {pkg.destination}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-surface-blue text-navy">
                        {PACKAGE_TYPES.find((type) => type.value === pkg.package_type)?.label ||
                          pkg.package_type ||
                          "Family"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-navy/70 whitespace-nowrap">
                      ₹{Number(pkg.price).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                        {pkg.is_popular && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                            Popular
                          </span>
                        )}
                        {pkg.is_recommended && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                            Recommended
                          </span>
                        )}
                        {pkg.is_trending && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                            Trending
                          </span>
                        )}
                        {pkg.is_featured && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                            Featured
                          </span>
                        )}
                        {pkg.is_new && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                            New
                          </span>
                        )}
                        {pkg.is_most_visited && (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-navy/10 text-navy">
                            Most Visited
                          </span>
                        )}
                        {!pkg.is_popular &&
                          !pkg.is_recommended &&
                          !pkg.is_trending &&
                          !pkg.is_featured &&
                          !pkg.is_new &&
                          !pkg.is_most_visited && (
                            <span className="text-xs text-navy/40">No discovery labels</span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          pkg.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-surface text-navy/60"
                        }`}
                      >
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center sm:gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(pkg)}
                          className="text-secondary font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pkg.id)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-navy/40">
                      No packages yet.
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
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-3xl h-[96vh] overflow-y-auto">
            <div className="sticky top-0 z-20 bg-ivory px-4 sm:px-6 py-4 sm:py-5 border-b border-navy/10">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-navy">
                {editing?.id ? "Edit Package" : "New Package"}
              </h2>
              <p className="text-xs text-navy/50 mt-1">
                Control package content, publishing and where it appears across the website.
              </p>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
              {/* =================================================
                  BASIC DETAILS
              ================================================== */}
              <div>
                <h3 className="text-base font-semibold text-navy mb-4">Basic Package Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-navy mb-1.5">Title</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Example: Kerala 5 Days Package"
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Destination
                    </label>
                    <select
                      required
                      value={form.destination_id}
                      disabled={destinationsLoading}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const selected = destinations.find(
                          (destination) => Number(destination?.id) === selectedId
                        );
                        setForm((current) => ({
                          ...current,
                          destination_id: selectedId || "",
                          destination: selected?.place_name || selected?.name || "",
                        }));
                      }}
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white disabled:bg-surface disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {destinationsLoading ? "Loading destinations..." : "Select destination"}
                      </option>
                      {destinations.map((destination) => (
                        <option key={destination.id} value={destination.id}>
                          {destination.place_name || destination.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-navy/40 mt-1">
                      Select a destination from Most Visited. The destination ID is added
                      automatically.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Package Type
                    </label>
                    <select
                      value={form.package_type}
                      onChange={(e) => updateField("package_type", e.target.value)}
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    >
                      {PACKAGE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.display_order}
                      onChange={(e) => updateField("display_order", e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
                    />
                    <p className="text-xs text-navy/40 mt-1">Lower numbers appear first.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.duration_days}
                      onChange={(e) => updateField("duration_days", e.target.value)}
                      placeholder="5"
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Duration (nights)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.duration_nights}
                      onChange={(e) => updateField("duration_nights", e.target.value)}
                      placeholder="4"
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
                    />
                    <p className="text-xs text-navy/40 mt-1">
                      Usually days minus 1. Example: 5 days = 4 nights.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="25000"
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* =================================================
                  PACKAGE DISCOVERY
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-navy">Package Discovery</h3>
                  <p className="text-xs text-navy/50 mt-1">
                    Choose the sections where this package should appear on the website. A
                    package can appear in multiple sections.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DISCOVERY_OPTIONS.map((option) => {
                    const checked = Boolean(form[option.key]);
                    return (
                      <label
                        key={option.key}
                        className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? "border-accent/50 bg-surface-orange"
                            : "border-navy/10 bg-white hover:bg-surface"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDiscovery(option.key)}
                          className="mt-0.5 h-4 w-4 rounded border-navy/30 text-accent focus:ring-accent"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-navy">
                            {option.label}
                          </span>
                          <span className="block text-xs text-navy/50 mt-0.5">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl bg-surface border border-navy/5 p-3">
                  <p className="text-xs font-semibold text-navy mb-2">Current discovery labels</p>
                  <div className="flex flex-wrap gap-2">
                    {DISCOVERY_OPTIONS.filter((option) => form[option.key]).map((option) => (
                      <span
                        key={option.key}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-navy/10 text-navy"
                      >
                        {option.label}
                      </span>
                    ))}
                    {DISCOVERY_OPTIONS.every((option) => !form[option.key]) && (
                      <span className="text-xs text-navy/40">No discovery sections selected.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the package..."
                  className="w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
              </div>

              {/* =================================================
                  ITINERARY — title, image, paragraph description
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-navy">Itinerary</label>
                    <p className="text-xs text-navy/50 mt-1">
                      Add a title, a full paragraph description, and an image for every day of
                      the trip.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="w-full sm:w-auto bg-navy text-ivory text-sm font-semibold px-3 py-2.5 rounded-lg hover:bg-navy-light"
                  >
                    + Add Day
                  </button>
                </div>

                {form.itinerary.length === 0 && (
                  <div className="border border-dashed border-navy/20 rounded-xl p-5 text-center">
                    <p className="text-sm text-navy/50">No itinerary days added yet.</p>
                    <p className="text-xs text-navy/40 mt-1">Click "+ Add Day" to create Day 1.</p>
                  </div>
                )}

                <div className="space-y-5">
                  {form.itinerary.map((item, index) => (
                    <div
                      key={index}
                      className="border border-navy/10 bg-white rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-surface border-b border-navy/10">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-navy text-ivory text-sm font-semibold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy">Day {index + 1}</p>
                            <p className="text-xs text-navy/40">
                              Day {index + 1} itinerary details
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(index)}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="p-3 sm:p-4">
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-navy mb-1.5">
                            Day {index + 1} Title
                          </label>
                          <input
                            required
                            value={item?.title || ""}
                            onChange={(e) =>
                              updateItineraryDay(index, "title", e.target.value)
                            }
                            placeholder="Example: Arrival in Kochi & Local Sightseeing"
                            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-navy mb-1.5">
                            Day {index + 1} Description 
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={item?.description || ""}
                            onChange={(e) =>
                              updateItineraryDay(index, "description", e.target.value)
                            }
                            placeholder="Description"
                            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-navy/15 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-navy">
                              Day {index + 1} Image
                            </label>
                            {item?.image && (
                              <span className="text-xs text-green-600 font-medium">
                                Image added
                              </span>
                            )}
                          </div>

                          {item?.image ? (
                            <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden border border-navy/15 bg-surface">
                              <img
                                src={item.image}
                                alt={item?.title || `Day ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                                <p className="text-white text-xs font-semibold">
                                  Day {index + 1}
                                </p>
                                {item?.title && (
                                  <p className="text-white text-sm font-medium truncate">
                                    {item.title}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItineraryImage(index)}
                                className="absolute top-2 right-2 bg-navy-dark/80 hover:bg-navy-dark text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors"
                                aria-label={`Remove Day ${index + 1} image`}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="w-full">
                              <ImageUploadField
                                value={null}
                                onChange={(img) => addItineraryImage(index, img)}
                                label=""
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {form.itinerary.length > 0 && (
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="w-full mt-4 border border-dashed border-navy/20 rounded-lg py-2.5 text-sm font-medium text-secondary hover:bg-surface"
                  >
                    + Add Day {form.itinerary.length + 1}
                  </button>
                )}
              </div>

              {/* =================================================
                  PACKAGE IMAGES
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <label className="block text-sm font-semibold text-navy mb-2">
                  Package Images
                </label>
                <p className="text-xs text-navy/50 mb-3">
                  Add main images 
                </p>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 rounded-lg overflow-hidden border border-navy/15 shrink-0"
                    >
                      <img src={img?.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-navy-dark/70 text-ivory rounded-full w-6 h-6 text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="w-24 h-24 shrink-0">
                    <ImageUploadField value={null} onChange={addImage} label="" />
                  </div>
                </div>
              </div>

              {/* =================================================
                  FACILITIES — one per line / comma separated -> points
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-navy">Facilities</h3>
                </div>
                <textarea
                  rows={4}
                  value={form.facilities}
                  onChange={(e) => updateField("facilities", e.target.value)}
                  placeholder={"Ex:Hotel accommodation"}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
                {parseListText(form.facilities).length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
                    {parseListText(form.facilities).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* =================================================
                  INCLUSIONS — one per line / comma separated -> points
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-navy">Inclusions</h3>
                </div>
                <textarea
                  rows={4}
                  value={form.inclusions}
                  onChange={(e) => updateField("inclusions", e.target.value)}
                  placeholder={"Ex: 4 nights hotel accommodation"}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
                {parseListText(form.inclusions).length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
                    {parseListText(form.inclusions).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* =================================================
                  EXCLUSIONS — one per line / comma separated -> points
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-navy">Exclusions</h3>
                </div>
                <textarea
                  rows={4}
                  value={form.exclusions}
                  onChange={(e) => updateField("exclusions", e.target.value)}
                  placeholder={"Ex:Flight tickets"}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
                {parseListText(form.exclusions).length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-navy/50 space-y-0.5">
                    {parseListText(form.exclusions).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* =================================================
                  TERMS & CONDITIONS
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <label className="block text-sm font-semibold text-navy mb-1.5">
                  Terms & Conditions
                </label>
                <textarea
                  rows={6}
                  value={form.terms_and_conditions}
                  onChange={(e) => updateField("terms_and_conditions", e.target.value)}
                  placeholder="Enter package terms and conditions..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
              </div>

              {/* =================================================
                  CANCELLATION POLICY
              ================================================== */}
              <div className="border-t border-navy/10 pt-5">
                <label className="block text-sm font-semibold text-navy mb-1.5">
                  Cancellation Policy
                </label>
                <textarea
                  rows={6}
                  value={form.cancellation_policy}
                  onChange={(e) => updateField("cancellation_policy", e.target.value)}
                  placeholder="Enter cancellation policy..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
              </div>

              {/* =================================================
                  ERROR
              ================================================== */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* =================================================
                  ACTION BUTTONS
              ================================================== */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing?.id ? "Update Package" : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}






