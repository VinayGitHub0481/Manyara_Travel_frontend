

import { useEffect, useState } from "react";
import {
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../../api/adminBatch";
import { getAllPackagesAdmin } from "../../api/adminPackages";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY_FORM = {
  package_id: "",
  display_order: "",
  departure_date: "",
  return_date: "",
  duration_mode: "default",
  days: "",
  nights: "",
  price_mode: "default",
  price_per_person: "",
  itinerary_mode: "default",
  custom_itinerary: [],
  inclusions_mode: "default",
  custom_inclusions: [],
  exclusions_mode: "default",
  custom_exclusions: [],
  terms_mode: "default",
  custom_terms_and_conditions: [],
  cancellation_mode: "default",
  custom_cancellation_policy: [],
  availability: "open",
  status: "draft",
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image?.url || null;
};

const normalizeItineraryImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") return image;
  return image?.url || null;
};

const normalizeItinerary = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    day: index + 1,
    title: item?.title || "",
    description: item?.description || "",
    image: normalizeItineraryImage(item?.image),
  }));
};

const normalizeStringList = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      item !== null &&
      item !== undefined &&
      String(item).trim() !== ""
  );
};

export default function BatchManage() {
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [batchData, packageData] = await Promise.all([
        getAllBatches(),
        getAllPackagesAdmin(),
      ]);

      setItems(Array.isArray(batchData) ? batchData : []);

      const packageItems = Array.isArray(packageData)
        ? packageData
        : Array.isArray(packageData?.items)
        ? packageData.items
        : Array.isArray(packageData?.data)
        ? packageData.data
        : [];
      setPackages(packageItems);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load batches and packages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getSelectablePackages = () => {
    const published = packages.filter(
      (pkg) =>
        String(pkg?.status || "published").toLowerCase() ===
        "published"
    );
    const selectedId = Number(form.package_id);
    if (!selectedId) return published;

    const selectedPackage = packages.find(
      (pkg) => Number(pkg?.id) === selectedId
    );

    if (
      selectedPackage &&
      !published.some((pkg) => Number(pkg?.id) === selectedId)
    ) {
      return [selectedPackage, ...published];
    }
    return published;
  };

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      custom_itinerary: [],
      custom_inclusions: [],
      custom_exclusions: [],
      custom_terms_and_conditions: [],
      custom_cancellation_policy: [],
    });
    setError("");
    setEditing({});
  };

  const openEdit = (batch) => {
    const itinerarySource =
      Array.isArray(batch?.custom_itinerary)
        ? batch.custom_itinerary
        : batch?.itinerary_mode === "custom"
        ? batch?.itinerary
        : [];
    const inclusionsSource =
      Array.isArray(batch?.custom_inclusions)
        ? batch.custom_inclusions
        : batch?.inclusions_mode === "custom"
        ? batch?.inclusions
        : [];
    const exclusionsSource =
      Array.isArray(batch?.custom_exclusions)
        ? batch.custom_exclusions
        : batch?.exclusions_mode === "custom"
        ? batch?.exclusions
        : [];
    const termsSource =
      Array.isArray(batch?.custom_terms_and_conditions)
        ? batch.custom_terms_and_conditions
        : batch?.terms_mode === "custom"
        ? batch?.terms_and_conditions
        : [];
    const cancellationSource =
      Array.isArray(batch?.custom_cancellation_policy)
        ? batch.custom_cancellation_policy
        : batch?.cancellation_mode === "custom"
        ? batch?.cancellation_policy
        : [];

    setForm({
      package_id: batch?.package_id ?? batch?.package?.id ?? "",
      display_order: batch?.display_order ?? "",
      departure_date: batch?.departure_date
        ? String(batch.departure_date).slice(0, 10)
        : "",
      return_date: batch?.return_date
        ? String(batch.return_date).slice(0, 10)
        : "",
      duration_mode: batch?.duration_mode || "default",
      days:
        batch?.days !== null && batch?.days !== undefined
          ? batch.days
          : "",
      nights:
        batch?.nights !== null && batch?.nights !== undefined
          ? batch.nights
          : "",
      price_mode: batch?.price_mode || "default",
      price_per_person:
        batch?.price_per_person !== null &&
        batch?.price_per_person !== undefined
          ? batch.price_per_person
          : "",
      itinerary_mode: batch?.itinerary_mode || "default",
      custom_itinerary: normalizeItinerary(itinerarySource),
      inclusions_mode: batch?.inclusions_mode || "default",
      custom_inclusions: normalizeStringList(inclusionsSource),
      exclusions_mode: batch?.exclusions_mode || "default",
      custom_exclusions: normalizeStringList(exclusionsSource),
      terms_mode: batch?.terms_mode || "default",
      custom_terms_and_conditions: normalizeStringList(termsSource),
      cancellation_mode: batch?.cancellation_mode || "default",
      custom_cancellation_policy: normalizeStringList(cancellationSource),
      availability: batch?.availability || "open",
      status: batch?.status || "draft",
    });
    setError("");
    setEditing(batch);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.package_id) {
      setError("Please select a package.");
      return;
    }
    if (!form.departure_date) {
      setError("Departure date is required.");
      return;
    }
    if (!form.return_date) {
      setError("Return date is required.");
      return;
    }
    if (new Date(form.return_date) < new Date(form.departure_date)) {
      setError("Return date cannot be before departure date.");
      return;
    }

    if (form.duration_mode === "custom") {
      if (!form.days) {
        setError("Custom duration requires number of days.");
        return;
      }
      if (
        form.nights === "" ||
        form.nights === null ||
        form.nights === undefined
      ) {
        setError("Custom duration requires number of nights.");
        return;
      }
    }

    if (form.price_mode === "custom") {
      if (
        form.price_per_person === "" ||
        Number(form.price_per_person) <= 0
      ) {
        setError("Custom price must be greater than 0.");
        return;
      }
    }

    if (form.itinerary_mode === "custom") {
      if (form.custom_itinerary.length === 0) {
        setError("Custom itinerary requires at least one day.");
        return;
      }
      const invalidDay = form.custom_itinerary.find(
        (item) =>
          !item?.title || String(item.title).trim().length < 2
      );
      if (invalidDay) {
        setError(
          "Every itinerary day requires a title of at least 2 characters."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const orderValue =
        form.display_order === "" ? null : Number(form.display_order);

      const payload = {
        package_id: Number(form.package_id),
        departure_date: form.departure_date,
        return_date: form.return_date,
        // Create: send 0 when empty -> backend adds the batch last in its package.
        // Update: omit when empty -> the position stays unchanged.
        ...(editing?.id
          ? orderValue
            ? { display_order: orderValue }
            : {}
          : { display_order: orderValue || 0 }),
        duration_mode: form.duration_mode,
        days:
          form.duration_mode === "custom" ? Number(form.days) : null,
        nights:
          form.duration_mode === "custom" ? Number(form.nights) : null,
        price_mode: form.price_mode,
        price_per_person:
          form.price_mode === "custom"
            ? Number(form.price_per_person)
            : null,
        itinerary_mode: form.itinerary_mode,
        custom_itinerary:
          form.itinerary_mode === "custom"
            ? form.custom_itinerary.map((item, index) => ({
                day: index + 1,
                title: String(item?.title || "").trim(),
                description: item?.description
                  ? String(item.description).trim()
                  : null,
                image: normalizeItineraryImage(item?.image),
              }))
            : null,
        inclusions_mode: form.inclusions_mode,
        custom_inclusions:
          form.inclusions_mode === "custom"
            ? normalizeStringList(form.custom_inclusions)
            : null,
        exclusions_mode: form.exclusions_mode,
        custom_exclusions:
          form.exclusions_mode === "custom"
            ? normalizeStringList(form.custom_exclusions)
            : null,
        terms_mode: form.terms_mode,
        custom_terms_and_conditions:
          form.terms_mode === "custom"
            ? normalizeStringList(form.custom_terms_and_conditions)
            : null,
        cancellation_mode: form.cancellation_mode,
        custom_cancellation_policy:
          form.cancellation_mode === "custom"
            ? normalizeStringList(form.custom_cancellation_policy)
            : null,
        availability: form.availability,
        status: form.status,
      };

      if (editing?.id) {
        await updateBatch(editing.id, payload);
      } else {
        await createBatch(payload);
      }

      setEditing(null);
      setForm({ ...EMPTY_FORM });
      await load();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item) =>
                item?.msg || item?.message || String(item)
            )
            .join(" | ")
        );
      } else {
        setError(detail || "Could not save batch.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this batch? This action cannot be undone.")) {
      return;
    }
    try {
      setError("");
      await deleteBatch(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not delete batch.");
    }
  };

  const getPackageTitle = (batch) =>
    batch?.package?.title || `Package #${batch?.package_id ?? "-"}`;

  const getDestination = (batch) => batch?.package?.destination || "-";

  const getPackageImage = (batch) => {
    const images = batch?.package?.images;
    if (!Array.isArray(images)) return null;
    return getImageUrl(images[0]);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const number = Number(value);
    if (Number.isNaN(number)) return "-";
    return `₹${number.toLocaleString("en-IN")}`;
  };

  const formatDuration = (batch) => {
    if (
      batch?.duration_days === null ||
      batch?.duration_days === undefined
    ) {
      if (batch?.days !== null && batch?.days !== undefined) {
        const days = Number(batch.days);
        const nights =
          batch?.nights !== null && batch?.nights !== undefined
            ? Number(batch.nights)
            : null;
        if (nights !== null) {
          return `${days} ${days === 1 ? "day" : "days"} / ${nights} ${nights === 1 ? "night" : "nights"}`;
        }
        return `${days} ${days === 1 ? "day" : "days"}`;
      }
      return "-";
    }
    const days = Number(batch.duration_days);
    const nights =
      batch?.duration_nights !== null &&
      batch?.duration_nights !== undefined
        ? Number(batch.duration_nights)
        : null;
    if (nights !== null) {
      return `${days} ${days === 1 ? "day" : "days"} / ${nights} ${nights === 1 ? "night" : "nights"}`;
    }
    return `${days} ${days === 1 ? "day" : "days"}`;
  };

  const addItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      custom_itinerary: [
        ...prev.custom_itinerary,
        {
          day: prev.custom_itinerary.length + 1,
          title: "",
          description: "",
          image: null,
        },
      ],
    }));
  };

  const updateItineraryDay = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      custom_itinerary: prev.custom_itinerary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItineraryDay = (index) => {
    setForm((prev) => ({
      ...prev,
      custom_itinerary: prev.custom_itinerary
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, day: i + 1 })),
    }));
  };

  const addListItem = (field) => {
    setForm((prev) => ({
      ...prev,
      [field]: [
        ...(Array.isArray(prev[field]) ? prev[field] : []),
        "",
      ],
    }));
  };

  const updateListItem = (field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const removeListItem = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const ModeSelector = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-navy">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange("default")}
          className={`rounded-lg border px-3 py-2.5 text-sm text-left transition ${
            value === "default"
              ? "border-navy bg-navy text-ivory"
              : "border-navy/15 bg-white text-navy hover:bg-surface"
          }`}
        >
          <span className="font-semibold">Use Package</span>
          <span
            className={`block text-[11px] mt-0.5 ${
              value === "default" ? "text-ivory/70" : "text-navy/45"
            }`}
          >
            {description || "Use the package's existing value."}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("custom")}
          className={`rounded-lg border px-3 py-2.5 text-sm text-left transition ${
            value === "custom"
              ? "border-accent bg-accent/10 text-navy"
              : "border-navy/15 bg-white text-navy hover:bg-surface"
          }`}
        >
          <span className="font-semibold">Custom Batch</span>
          <span className="block text-[11px] text-navy/45 mt-0.5">
            Override the package value.
          </span>
        </button>
      </div>
    </div>
  );

  const ListEditor = ({ title, items, field, addLabel, placeholder }) => (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="font-semibold text-navy text-base">{title}</h3>
        <button
          type="button"
          onClick={() => addListItem(field)}
          className="w-full sm:w-auto px-3 py-2 rounded-lg bg-navy text-ivory text-sm font-medium hover:bg-navy-light"
        >
          + {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={item || ""}
              onChange={(e) => updateListItem(field, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-navy/15 text-sm bg-white"
            />
            <button
              type="button"
              onClick={() => removeListItem(field, index)}
              className="shrink-0 w-10 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 text-lg"
              aria-label={`Remove ${title} item`}
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-navy/15 p-5 text-center">
            <p className="text-xs text-navy/40">No custom items added.</p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-navy">Batches</h1>
          <p className="text-sm text-navy/50 mt-1">
            Manage scheduled package departures, pricing, duration, itinerary and availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Batch
        </button>
      </div>

      {error && editing === null && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center">
          <p className="text-sm text-navy/50">Loading batches…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {items.map((batch) => {
            const packageImage = getPackageImage(batch);
            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl border border-navy/10 overflow-hidden min-w-0 shadow-sm"
              >
                <div className="h-40 sm:h-36 md:h-40 bg-surface">
                  {packageImage ? (
                    <img
                      src={packageImage}
                      alt={getPackageTitle(batch)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-navy/30">
                      No package image
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy text-sm sm:text-base break-words">
                        {getPackageTitle(batch)}
                      </p>
                      <p className="text-xs text-navy/45 mt-0.5 break-all">
                        {batch?.slug || `Batch #${batch?.id}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                        batch.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {batch.status || "draft"}
                    </span>
                  </div>

                  <p className="text-xs text-navy/60 mt-3 break-words">
                    <span className="font-medium">Destination:</span>{" "}
                    {getDestination(batch)}
                  </p>

                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-navy/60">
                      <span className="font-medium">Departure:</span>{" "}
                      {formatDate(batch.departure_date)}
                    </p>
                    <p className="text-xs text-navy/60">
                      <span className="font-medium">Return:</span>{" "}
                      {formatDate(batch.return_date)}
                    </p>
                  </div>

                  <p className="text-xs text-navy/60 mt-2">
                    <span className="font-medium">Order:</span>{" "}
                    {batch.display_order ?? "-"}
                  </p>

                  <p className="text-xs text-navy/60 mt-1">
                    <span className="font-medium">Price:</span>{" "}
                    {formatPrice(batch.price_per_person)}
                    {batch.price_mode === "default" && (
                      <span className="ml-1 text-[10px] text-navy/40">package</span>
                    )}
                  </p>

                  <p className="text-xs text-navy/60 mt-1">
                    <span className="font-medium">Duration:</span>{" "}
                    {formatDuration(batch)}
                    {batch.duration_mode === "default" && (
                      <span className="ml-1 text-[10px] text-navy/40">package</span>
                    )}
                  </p>

                  <p className="text-xs text-navy/60 mt-1">
                    <span className="font-medium">Availability:</span>{" "}
                    {String(batch.availability || "open").replace("_", " ")}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {batch.price_mode === "custom" && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        Custom Price
                      </span>
                    )}
                    {batch.duration_mode === "custom" && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        Custom Duration
                      </span>
                    )}
                    {batch.itinerary_mode === "custom" && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                        Custom Itinerary
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(batch)}
                      className="w-full sm:w-auto text-secondary text-sm font-medium hover:underline text-left sm:text-center py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(batch.id)}
                      className="w-full sm:w-auto text-red-600 text-sm font-medium hover:underline text-left sm:text-center py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full py-10 text-center">
              <p className="text-navy/40 text-sm">No batches yet.</p>
            </div>
          )}
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-4xl h-[96vh] sm:h-auto sm:max-h-[94vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-30 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-navy">
                    {editing?.id ? "Edit Batch" : "New Batch"}
                  </h2>
                  <p className="text-xs text-navy/45 mt-1">
                    Configure this scheduled departure for the selected package.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="shrink-0 w-9 h-9 rounded-full hover:bg-surface text-navy/60 text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-8">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
                  {error}
                </div>
              )}

              <section>
                <h3 className="font-semibold text-navy text-base mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Package
                    </label>
                    <select
                      required
                      value={form.package_id}
                      onChange={(e) => updateField("package_id", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    >
                      <option value="">
                        {packages.length === 0 ? "No packages available" : "Select a package"}
                      </option>
                      {getSelectablePackages().map((pkg) => (
                        <option key={pkg?.id} value={pkg?.id}>
                          {pkg?.title || `Package #${pkg?.id}`}
                          {pkg?.destination ? ` — ${pkg.destination}` : ""}
                          {String(pkg?.status || "published").toLowerCase() !== "published"
                            ? " — Draft / unavailable for new batches"
                            : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-navy/40 mt-1">
                      Select an existing published package. When editing an older batch, its existing package remains selectable even if it is no longer published.
                    </p>
                    {packages.length > 0 && getSelectablePackages().length === 0 && (
                      <p className="text-[11px] text-red-600 mt-1">
                        No published packages are currently available for a new batch.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Departure Date</label>
                    <input
                      required
                      type="date"
                      value={form.departure_date}
                      onChange={(e) => updateField("departure_date", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Return Date</label>
                    <input
                      required
                      type="date"
                      value={form.return_date}
                      min={form.departure_date || undefined}
                      onChange={(e) => updateField("return_date", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.display_order}
                      onChange={(e) => updateField("display_order", e.target.value)}
                      placeholder="Leave empty to add at the end"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    />
                    <p className="text-[11px] text-navy/40 mt-1">
                      Position among this package's batches. Lower numbers appear first, and
                      other batches of the same package shift automatically.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <ModeSelector
                  label="Duration"
                  value={form.duration_mode}
                  onChange={(value) => updateField("duration_mode", value)}
                  description="Use the package duration automatically."
                />
                {form.duration_mode === "custom" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 rounded-xl border border-navy/10 bg-white p-4">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Days</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={form.days}
                        onChange={(e) => updateField("days", e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2.5 rounded-lg border border-navy/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">Nights</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={form.nights}
                        onChange={(e) => updateField("nights", e.target.value)}
                        placeholder="e.g. 4"
                        className="w-full px-3 py-2.5 rounded-lg border border-navy/15 text-sm"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Price"
                  value={form.price_mode}
                  onChange={(value) => updateField("price_mode", value)}
                  description="Use the package price automatically."
                />
                {form.price_mode === "custom" && (
                  <div className="mt-4 rounded-xl border border-navy/10 bg-white p-4">
                    <label className="block text-sm font-medium text-navy mb-1.5">Price Per Person (₹)</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price_per_person}
                      onChange={(e) => updateField("price_per_person", e.target.value)}
                      placeholder="e.g. 14999"
                      className="w-full px-3 py-2.5 rounded-lg border border-navy/15 text-sm"
                    />
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Itinerary"
                  value={form.itinerary_mode}
                  onChange={(value) => updateField("itinerary_mode", value)}
                  description="Use the package itinerary automatically."
                />
                {form.itinerary_mode === "custom" && (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-navy">Custom Day-by-Day Itinerary</h4>
                        <p className="text-xs text-navy/45 mt-1">You can add a separate image for every itinerary day.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addItineraryDay}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg bg-navy text-ivory text-sm font-medium hover:bg-navy-light"
                      >
                        + Add Day
                      </button>
                    </div>

                    {form.custom_itinerary.map((day, index) => (
                      <div key={index} className="rounded-xl border border-navy/10 bg-white p-4">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-navy text-ivory text-xs font-semibold">
                            {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(index)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove Day
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-navy mb-1.5">Day Title</label>
                            <input
                              required
                              minLength={2}
                              maxLength={200}
                              value={day.title || ""}
                              onChange={(e) => updateItineraryDay(index, "title", e.target.value)}
                              placeholder="e.g. Arrival & Hotel Check-in"
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/15 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-navy mb-1.5">Day Description</label>
                            <textarea
                              rows={4}
                              value={day.description || ""}
                              onChange={(e) => updateItineraryDay(index, "description", e.target.value)}
                              placeholder="Describe the activities, sightseeing, meals, transfers, hotel stay, etc."
                              className="w-full px-3 py-2.5 rounded-lg border border-navy/15 text-sm resize-none"
                            />
                          </div>
                          <div>
                            <ImageUploadField
                              value={day.image || null}
                              onChange={(image) => updateItineraryDay(index, "image", image)}
                              label={`Day ${index + 1} Image`}
                            />
                            <p className="text-[11px] text-navy/40 mt-1">
                              Optional. This image belongs only to this itinerary day.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {form.custom_itinerary.length === 0 && (
                      <div className="rounded-lg border border-dashed border-navy/15 p-6 text-center">
                        <p className="text-xs text-navy/40">No custom itinerary days added yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Inclusions"
                  value={form.inclusions_mode}
                  onChange={(value) => updateField("inclusions_mode", value)}
                  description="Use the package inclusions automatically."
                />
                {form.inclusions_mode === "custom" && (
                  <div className="mt-4">
                    <ListEditor
                      title="Custom Inclusions"
                      items={form.custom_inclusions}
                      field="custom_inclusions"
                      addLabel="Add Inclusion"
                      placeholder="e.g. Hotel accommodation"
                    />
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Exclusions"
                  value={form.exclusions_mode}
                  onChange={(value) => updateField("exclusions_mode", value)}
                  description="Use the package exclusions automatically."
                />
                {form.exclusions_mode === "custom" && (
                  <div className="mt-4">
                    <ListEditor
                      title="Custom Exclusions"
                      items={form.custom_exclusions}
                      field="custom_exclusions"
                      addLabel="Add Exclusion"
                      placeholder="e.g. Personal expenses"
                    />
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Terms & Conditions"
                  value={form.terms_mode}
                  onChange={(value) => updateField("terms_mode", value)}
                  description="Use the package terms automatically."
                />
                {form.terms_mode === "custom" && (
                  <div className="mt-4">
                    <ListEditor
                      title="Custom Terms & Conditions"
                      items={form.custom_terms_and_conditions}
                      field="custom_terms_and_conditions"
                      addLabel="Add Term"
                      placeholder="Enter a term or condition"
                    />
                  </div>
                )}
              </section>

              <section>
                <ModeSelector
                  label="Cancellation Policy"
                  value={form.cancellation_mode}
                  onChange={(value) => updateField("cancellation_mode", value)}
                  description="Use the package cancellation policy automatically."
                />
                {form.cancellation_mode === "custom" && (
                  <div className="mt-4">
                    <ListEditor
                      title="Custom Cancellation Policy"
                      items={form.custom_cancellation_policy}
                      field="custom_cancellation_policy"
                      addLabel="Add Policy Item"
                      placeholder="e.g. 50% refund before 15 days"
                    />
                  </div>
                )}
              </section>

              <section>
                <h3 className="font-semibold text-navy text-base mb-4">Availability & Publishing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Availability</label>
                    <select
                      value={form.availability}
                      onChange={(e) => updateField("availability", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    >
                      <option value="open">Open</option>
                      <option value="limited">Limited</option>
                      <option value="almost_full">Almost Full</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-ivory border-t border-navy/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-navy/60 hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-navy text-ivory hover:bg-navy-light disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing?.id ? "Update Batch" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

