


import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Edit3,
  Image as ImageIcon,
  ListOrdered,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  Eye,
  EyeOff,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import ImageUploadField from "../../components/admin/ImageUploadField";

// =========================================================
// Constants
// =========================================================

const EMPTY_FORM = {
  year: "",
  title: "",
  description: "",
  image: null,
  display_order: 0,
  is_active: true,
};

const MILESTONE_API = "/about/admin/milestones";

// =========================================================
// Helpers
// =========================================================

function getErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => item?.msg || item?.message)
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return fallback;
}

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return image.url || "";
  }

  return "";
}

function normalizeMilestone(item) {
  return {
    ...item,
    year: item?.year ?? "",
    title: item?.title ?? "",
    description: item?.description ?? "",
    image: item?.image ?? null,
    display_order: item?.display_order ?? 0,
    is_active: item?.is_active ?? true,
  };
}

function sortMilestones(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.display_order ?? 0);
    const orderB = Number(b.display_order ?? 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return Number(a.year ?? 0) - Number(b.year ?? 0);
  });
}

// =========================================================
// Reusable Form Components
// =========================================================

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}
      {required && <span className="ml-1 text-orange-600">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  disabled = false,
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
    />
  );
}

// =========================================================
// Toggle
// =========================================================

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300"
    >
      <div className="pr-4">
        <p className="text-sm font-semibold text-slate-800">{label}</p>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-orange-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

// =========================================================
// Main Component
// =========================================================

export default function MilestoneAdmin() {
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =======================================================
  // Load milestones
  // =======================================================

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(MILESTONE_API);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      setMilestones(sortMilestones(data.map(normalizeMilestone)));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load milestones."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  // =======================================================
  // Filter
  // =======================================================

  const filteredMilestones = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return milestones;
    }

    return milestones.filter((milestone) => {
      return (
        String(milestone.year).includes(query) ||
        milestone.title?.toLowerCase().includes(query) ||
        milestone.description?.toLowerCase().includes(query)
      );
    });
  }, [milestones, search]);

  // =======================================================
  // Stats
  // =======================================================

  const stats = useMemo(() => {
    return {
      total: milestones.length,
      active: milestones.filter((item) => item.is_active).length,
      inactive: milestones.filter((item) => !item.is_active).length,
    };
  }, [milestones]);

  // =======================================================
  // Form helpers
  // =======================================================

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (milestone) => {
    setEditingId(milestone.id);

    setForm({
      year: milestone.year ?? "",
      title: milestone.title ?? "",
      description: milestone.description ?? "",
      image: milestone.image ?? null,
      display_order: milestone.display_order ?? 0,
      is_active: Boolean(milestone.is_active),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // =======================================================
  // Validation
  // =======================================================

  const validateForm = () => {
    if (!form.year) {
      return "Year is required.";
    }

    const year = Number(form.year);

    if (!Number.isInteger(year)) {
      return "Year must be a valid whole number.";
    }

    if (year < 1900 || year > 2200) {
      return "Please enter a valid year.";
    }

    if (!form.title.trim()) {
      return "Milestone title is required.";
    }

    const displayOrder = Number(form.display_order);

    if (!Number.isFinite(displayOrder) || displayOrder < 0) {
      return "Display order cannot be negative.";
    }

    return "";
  };

  // =======================================================
  // Payload
  // =======================================================

  const buildPayload = () => {
    let image = null;

    if (form.image) {
      if (typeof form.image === "string") {
        image = {
          url: form.image,
          public_id: null,
        };
      } else if (typeof form.image === "object") {
        if (form.image.url || form.image.public_id) {
          image = {
            url: form.image.url || null,
            public_id: form.image.public_id || null,
          };
        }
      }
    }

    return {
      year: Number(form.year),

      title: form.title.trim(),

      description: form.description.trim() || null,

      image,

      display_order: Number(form.display_order) || 0,

      is_active: Boolean(form.is_active),
    };
  };

  // =======================================================
  // Save
  // =======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = buildPayload();

      if (editingId) {
        await api.put(`${MILESTONE_API}/${editingId}`, payload);

        setSuccess("Milestone updated successfully.");
      } else {
        await api.post(MILESTONE_API, payload);

        setSuccess("Milestone created successfully.");
      }

      await loadMilestones();

      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save milestone."));
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // Toggle active status
  // =======================================================

  const toggleActive = async (milestone) => {
    try {
      setError("");
      setSuccess("");

      const payload = {
        year: Number(milestone.year),

        title: milestone.title,

        description: milestone.description || null,

        image: milestone.image || null,

        display_order: Number(milestone.display_order) || 0,

        is_active: !milestone.is_active,
      };

      await api.put(`${MILESTONE_API}/${milestone.id}`, payload);

      setSuccess(
        milestone.is_active
          ? "Milestone hidden from the public page."
          : "Milestone is now visible publicly."
      );

      await loadMilestones();
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to update milestone status.")
      );
    }
  };

  // =======================================================
  // Delete
  // =======================================================

  const handleDelete = async (milestone) => {
    const confirmed = window.confirm(
      `Delete the milestone "${milestone.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(milestone.id);
      setError("");
      setSuccess("");

      await api.delete(`${MILESTONE_API}/${milestone.id}`);

      setSuccess("Milestone deleted successfully.");

      await loadMilestones();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete milestone."));
    } finally {
      setDeletingId(null);
    }
  };

  // =======================================================
  // Render
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            Header
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link
                to="/admin/dashboard/about"
                className="transition hover:text-orange-600"
              >
                About
              </Link>

              <span>/</span>

              <span className="text-slate-700">
                Milestones
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Milestones
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage the important years, achievements, and journey
              highlights displayed on the public About page.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20"
          >
            <Plus size={18} />
            Add milestone
          </button>
        </div>

        {/* =================================================
            Alerts
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =================================================
            Stats
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total milestones
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Calendar size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {stats.active}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Eye size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inactive
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-500">
                  {stats.inactive}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <EyeOff size={21} />
              </div>
            </div>
          </div>

        </div>

        {/* =================================================
            Toolbar
        ================================================= */}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search milestones..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <Link
            to="/about"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
          >
            <Eye size={17} />
            View About page
          </Link>

        </div>

        {/* =================================================
            Loading
        ================================================= */}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-48 rounded-xl bg-slate-200" />

                <div className="mt-4 h-5 w-1/3 rounded bg-slate-200" />

                <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />

                <div className="mt-2 h-4 w-full rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredMilestones.length === 0 ? (

          /* =================================================
             Empty state
          ================================================= */

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Calendar size={30} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {search
                ? "No milestones found"
                : "No milestones yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Try a different search term."
                : "Start building your company's timeline by adding the first milestone."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                <Plus size={18} />
                Add first milestone
              </button>
            )}

          </div>
        ) : (

          /* =================================================
             Milestone cards
          ================================================= */

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {filteredMilestones.map((milestone) => {
              const imageUrl = getImageUrl(milestone.image);

              return (
                <article
                  key={milestone.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >

                  {/* Image */}

                  <div className="relative h-52 overflow-hidden bg-slate-100">

                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={milestone.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <ImageIcon
                            size={32}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-2 text-xs text-slate-400">
                            No image
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status */}

                    <div className="absolute left-3 top-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                          milestone.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {milestone.is_active ? (
                          <>
                            <Eye size={13} />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>

                    {/* Year */}

                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-3 py-2 text-sm font-bold text-white backdrop-blur">
                        <Calendar size={14} />
                        {milestone.year}
                      </span>
                    </div>

                  </div>

                  {/* Content */}

                  <div className="p-5">

                    <div className="mb-3 flex items-center justify-between gap-3">

                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <ListOrdered size={14} />
                        Order {milestone.display_order}
                      </span>

                      {milestone.updated_at && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 size={13} />
                          Updated
                        </span>
                      )}

                    </div>

                    <h2 className="line-clamp-2 text-lg font-bold text-slate-900">
                      {milestone.title}
                    </h2>

                    <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">
                      {milestone.description ||
                        "No description added."}
                    </p>

                    {/* Actions */}

                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">

                      <button
                        type="button"
                        onClick={() => openEditForm(milestone)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActive(milestone)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                          milestone.is_active
                            ? "border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title={
                          milestone.is_active
                            ? "Hide milestone"
                            : "Publish milestone"
                        }
                      >
                        {milestone.is_active ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(milestone)}
                        disabled={deletingId === milestone.id}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete milestone"
                      >
                        {deletingId === milestone.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>

                    </div>
                  </div>
                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* =====================================================
          Create/Edit Modal
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm">

          <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">

            <div className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl">

              {/* Modal Header */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                    About / Milestones
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {editingId
                      ? "Edit milestone"
                      : "Add milestone"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

              {/* Modal Body */}

              <form onSubmit={handleSubmit}>

                <div className="max-h-[75vh] overflow-y-auto px-5 py-6 sm:px-6">

                  {/* Basic Information */}

                  <section>

                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        Basic information
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Define the milestone year and title.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                      {/* Year */}

                      <div>
                        <FieldLabel required>
                          Year
                        </FieldLabel>

                        <TextInput
                          type="number"
                          value={form.year}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              year: value,
                            }))
                          }
                          placeholder="2024"
                          min="1900"
                          max="2200"
                        />
                      </div>

                      {/* Display Order */}

                      <div>
                        <FieldLabel required>
                          Display order
                        </FieldLabel>

                        <TextInput
                          type="number"
                          value={form.display_order}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              display_order: value,
                            }))
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      {/* Title */}

                      <div className="sm:col-span-2">
                        <FieldLabel required>
                          Milestone title
                        </FieldLabel>

                        <TextInput
                          value={form.title}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              title: value,
                            }))
                          }
                          placeholder="Launched On a Trip Holiday"
                        />
                      </div>

                      {/* Description */}

                      <div className="sm:col-span-2">
                        <FieldLabel>
                          Description
                        </FieldLabel>

                        <TextArea
                          value={form.description}
                          onChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                          placeholder="Describe what happened during this milestone..."
                          rows={5}
                        />
                      </div>

                    </div>
                  </section>

                  {/* =================================================
                      Milestone Image Upload
                  ================================================= */}

                  <section className="mt-8 border-t border-slate-100 pt-8">

                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        Milestone image
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Upload the milestone image directly. The image
                        will be uploaded automatically and the returned
                        Cloudinary image information will be stored with
                        the milestone.
                      </p>
                    </div>

                    <ImageUploadField
                      value={form.image}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          image: value,
                        }))
                      }
                      label="Upload milestone image"
                    />

                  </section>

                  {/* =================================================
                      Visibility
                  ================================================= */}

                  <section className="mt-8 border-t border-slate-100 pt-8">

                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        Visibility
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Control whether this milestone appears publicly.
                      </p>
                    </div>

                    <Toggle
                      checked={form.is_active}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: value,
                        }))
                      }
                      label="Active milestone"
                      description="Active milestones can appear on the public About page."
                    />

                  </section>

                  {/* =================================================
                      Database Fields Note
                  ================================================= */}

                  <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs leading-5 text-blue-700">
                      <strong>System-managed fields:</strong>{" "}
                      ID, created_at, and updated_at are managed by
                      the backend/database and are intentionally not
                      included in this form.
                    </p>
                  </div>

                </div>

                {/* Modal Footer */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? (
                          <Save size={17} />
                        ) : (
                          <Plus size={17} />
                        )}

                        {editingId
                          ? "Update milestone"
                          : "Create milestone"}
                      </>
                    )}
                  </button>

                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}


