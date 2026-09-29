import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  GripVertical,
  Heart,
  ShieldCheck,
  MapPin,
  Star,
  Compass,
  Users,
  Award,
  Sparkles,
  Target,
  Leaf,
  HandHeart,
  Gem,
  Eye,
  EyeOff,
  X,
  Save,
  RefreshCw,
  Info,
} from "lucide-react";
import api from "../../api/axios";
import { Link } from "react-router-dom";

/* ============================================================
   EMPTY FORM
============================================================ */

const EMPTY_FORM = {
  title: "",
  description: "",
  icon: "",
  display_order: 0,
  is_active: true,
};

/* ============================================================
   ICON OPTIONS
   These are stored as strings in the database.
============================================================ */

const ICON_OPTIONS = [
  { name: "Heart", icon: Heart },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "MapPin", icon: MapPin },
  { name: "Star", icon: Star },
  { name: "Compass", icon: Compass },
  { name: "Users", icon: Users },
  { name: "Award", icon: Award },
  { name: "Sparkles", icon: Sparkles },
  { name: "Target", icon: Target },
  { name: "Leaf", icon: Leaf },
  { name: "HandHeart", icon: HandHeart },
  { name: "Gem", icon: Gem },
];

/* ============================================================
   HELPERS
============================================================ */

const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((item) => item?.msg || "Validation error")
        .join(", ");
    }

    return String(error.response.data.detail);
  }

  if (error?.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const normalizeValue = (item) => ({
  id: item?.id ?? null,
  title: item?.title ?? "",
  description: item?.description ?? "",
  icon: item?.icon ?? "",
  display_order: Number(item?.display_order ?? 0),
  is_active: Boolean(item?.is_active),
  created_at: item?.created_at ?? null,
  updated_at: item?.updated_at ?? null,
});

const sortValues = (items) =>
  [...items].sort((a, b) => {
    const orderDifference =
      Number(a.display_order ?? 0) - Number(b.display_order ?? 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return String(a.title || "").localeCompare(String(b.title || ""));
  });

const getIconComponent = (iconName) => {
  if (!iconName) return Sparkles;

  const found = ICON_OPTIONS.find(
    (item) => item.name.toLowerCase() === iconName.toLowerCase()
  );

  return found?.icon || Sparkles;
};

/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-sm font-semibold text-navy-900">
    {children}

    {required && (
      <span className="ml-1 text-orange-600" aria-hidden="true">
        *
      </span>
    )}
  </label>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  min,
}) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    min={min}
    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
  />
);

const TextArea = ({
  value,
  onChange,
  placeholder,
  rows = 5,
  disabled = false,
}) => (
  <textarea
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
  />
);

const StatusBadge = ({ active }) => {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={14} />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
      <XCircle size={14} />
      Inactive
    </span>
  );
};

/* ============================================================
   ICON SELECTOR
============================================================ */

const IconSelector = ({ value, onChange }) => {
  const selectedIcon = value || "";

  return (
    <div>
      <FieldLabel>Icon</FieldLabel>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {ICON_OPTIONS.map(({ name, icon: Icon }) => {
          const selected =
            selectedIcon.toLowerCase() === name.toLowerCase();

          return (
            <button
              key={name}
              type="button"
              onClick={() =>
                onChange(selected ? "" : name)
              }
              className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition ${
                selected
                  ? "border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              <Icon size={22} />

              <span className="text-[11px] font-semibold">
                {name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <TextInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Or type an icon name, e.g. Heart"
        />
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        Store the Lucide icon component name in the database. The frontend
        can map this string to the corresponding icon.
      </p>
    </div>
  );
};

/* ============================================================
   VALUES ADMIN
============================================================ */

const ValuesAdmin = () => {
  const [values, setValues] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================================
     LOAD VALUES
  ========================================================== */

  const loadValues = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/about/admin/values");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setValues(sortValues(data.map(normalizeValue)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValues();
  }, []);

  /* ==========================================================
     FILTERED VALUES
  ========================================================== */

  const filteredValues = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return values;
    }

    return values.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.icon.toLowerCase().includes(query)
      );
    });
  }, [values, search]);

  /* ==========================================================
     STATS
  ========================================================== */

  const stats = useMemo(() => {
    const active = values.filter((item) => item.is_active).length;
    const inactive = values.length - active;

    return {
      total: values.length,
      active,
      inactive,
    };
  }, [values]);

  /* ==========================================================
     RESET FORM
  ========================================================== */

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  /* ==========================================================
     OPEN CREATE
  ========================================================== */

  const handleCreate = () => {
    setSuccess("");
    setError("");

    setForm({
      ...EMPTY_FORM,
      display_order: values.length,
    });

    setEditingId(null);
    setShowForm(true);
  };

  /* ==========================================================
     OPEN EDIT
  ========================================================== */

  const handleEdit = (item) => {
    setSuccess("");
    setError("");

    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      icon: item.icon ?? "",
      display_order: Number(item.display_order ?? 0),
      is_active: Boolean(item.is_active),
    });

    setEditingId(item.id);
    setShowForm(true);
  };

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Value title is required.";
    }

    if (form.title.trim().length > 200) {
      return "Value title must be 200 characters or less.";
    }

    if (form.display_order === "" || form.display_order === null) {
      return "Display order is required.";
    }

    if (Number(form.display_order) < 0) {
      return "Display order cannot be negative.";
    }

    return "";
  };

  /* ==========================================================
     BUILD PAYLOAD
  ========================================================== */

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    icon: form.icon.trim() || null,
    display_order: Number(form.display_order || 0),
    is_active: Boolean(form.is_active),
  });

  /* ==========================================================
     SAVE
  ========================================================== */

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
        await api.put(
          `/about/admin/values/${editingId}`,
          payload
        );

        setSuccess("Company value updated successfully.");
      } else {
        await api.post(
          "/about/admin/values",
          payload
        );

        setSuccess("Company value created successfully.");
      }

      await loadValues();

      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     TOGGLE ACTIVE
  ========================================================== */

  const handleToggleStatus = async (item) => {
    try {
      setError("");
      setSuccess("");

      const payload = {
        title: item.title,
        description: item.description || null,
        icon: item.icon || null,
        display_order: Number(item.display_order || 0),
        is_active: !item.is_active,
      };

      await api.put(
        `/about/admin/values/${item.id}`,
        payload
      );

      setSuccess(
        item.is_active
          ? `"${item.title}" is now inactive.`
          : `"${item.title}" is now active.`
      );

      await loadValues();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/about/admin/values/${item.id}`
      );

      setSuccess("Company value deleted successfully.");

      await loadValues();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              to="/admin/dashboard/about"
              className="transition hover:text-orange-600"
            >
              About Management
            </Link>

            <span>/</span>

            <span className="font-medium text-navy-800">
              Company Values
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                <Heart size={14} />
                About CMS
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Company Values
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Manage the values displayed on your public About page.
                Control their content, icons, ordering, and visibility.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 active:scale-[0.98]"
            >
              <Plus size={19} />
              Add Company Value
            </button>
          </div>
        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <XCircle size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 leading-5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 transition hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">Success</p>
              <p className="mt-1 leading-5">{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded-lg p-1 transition hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Values
                </p>

                <p className="mt-2 text-3xl font-black text-navy-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
                <Heart size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {stats.active}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Inactive
                </p>

                <p className="mt-2 text-3xl font-black text-slate-500">
                  {stats.inactive}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
                <EyeOff size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            SEARCH / TOOLBAR
        ==================================================== */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search values, descriptions or icons..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <button
              type="button"
              onClick={loadValues}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="mb-5 h-12 w-12 rounded-2xl bg-slate-200" />
                <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filteredValues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
              <Heart size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-navy-900">
              {search
                ? "No values found"
                : "No company values yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Try another search term."
                : "Add your first company value to start building the About page."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
              >
                <Plus size={18} />
                Add First Value
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredValues.map((item) => {
              const Icon = getIconComponent(item.icon);

              return (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                    item.is_active
                      ? "border-slate-200"
                      : "border-slate-200 opacity-75"
                  }`}
                >
                  {/* Card top */}
                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                        <Icon size={27} />
                      </div>

                      <StatusBadge active={item.is_active} />
                    </div>

                    <div className="mb-3 flex items-start gap-2">
                      <GripVertical
                        size={17}
                        className="mt-1 shrink-0 text-slate-300"
                      />

                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-xl font-black text-navy-900">
                          {item.title}
                        </h2>

                        {item.icon && (
                          <p className="mt-1 text-xs font-semibold text-orange-600">
                            {item.icon}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                      {item.description || (
                        <span className="italic text-slate-400">
                          No description provided.
                        </span>
                      )}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                          Order: {item.display_order}
                        </span>
                      </div>

                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <Eye size={14} />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <EyeOff size={14} />
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-slate-100 bg-slate-50/70">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(item)
                      }
                      className="flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-orange-600"
                    >
                      {item.is_active ? (
                        <>
                          <EyeOff size={16} />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Activate
                        </>
                      )}
                    </button>

                    <div className="my-2 w-px bg-slate-200" />

                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-orange-600"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <div className="my-2 w-px bg-slate-200" />

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-xs font-bold text-red-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deletingId === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ====================================================
            FORM MODAL
        ==================================================== */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    About CMS
                  </p>

                  <h2 className="mt-1 text-xl font-black text-navy-900 sm:text-2xl">
                    {editingId
                      ? "Edit Company Value"
                      : "Add Company Value"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleSubmit}
                className="overflow-y-auto"
              >
                <div className="space-y-6 p-5 sm:p-7">

                  {/* Basic Information */}
                  <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-bold text-navy-900">
                        Basic Information
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Define the value title and the message visitors
                        will see on the About page.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <FieldLabel required>
                          Value Title
                        </FieldLabel>

                        <TextInput
                          value={form.title}
                          onChange={(event) =>
                            updateField(
                              "title",
                              event.target.value
                            )
                          }
                          placeholder="e.g. Customer First"
                          disabled={saving}
                        />

                        <p className="mt-2 text-xs text-slate-400">
                          Maximum 200 characters.
                        </p>
                      </div>

                      <div>
                        <FieldLabel>
                          Description
                        </FieldLabel>

                        <TextArea
                          value={form.description}
                          onChange={(event) =>
                            updateField(
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Describe what this company value means..."
                          rows={5}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Icon */}
                  <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-bold text-navy-900">
                        Value Icon
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Choose a Lucide icon or enter another icon name.
                      </p>
                    </div>

                    <IconSelector
                      value={form.icon}
                      onChange={(value) =>
                        updateField("icon", value)
                      }
                    />
                  </section>

                  {/* Display Settings */}
                  <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-bold text-navy-900">
                        Display Settings
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Control the order and public visibility of this
                        value.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel required>
                          Display Order
                        </FieldLabel>

                        <TextInput
                          type="number"
                          min="0"
                          value={form.display_order}
                          onChange={(event) =>
                            updateField(
                              "display_order",
                              event.target.value
                            )
                          }
                          placeholder="0"
                          disabled={saving}
                        />

                        <p className="mt-2 text-xs text-slate-400">
                          Lower numbers appear first.
                        </p>
                      </div>

                      <div>
                        <FieldLabel>
                          Public Visibility
                        </FieldLabel>

                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "is_active",
                              !form.is_active
                            )
                          }
                          disabled={saving}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 transition ${
                            form.is_active
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-xl p-2 ${
                                form.is_active
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {form.is_active ? (
                                <Eye size={18} />
                              ) : (
                                <EyeOff size={18} />
                              )}
                            </div>

                            <div className="text-left">
                              <p className="text-sm font-bold text-slate-800">
                                {form.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </p>

                              <p className="text-xs text-slate-500">
                                {form.is_active
                                  ? "Visible publicly"
                                  : "Hidden publicly"}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`relative h-6 w-11 rounded-full transition ${
                              form.is_active
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                                form.is_active
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Form Error */}
                  {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <XCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p className="leading-5">
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={18}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingId
                          ? "Update Value"
                          : "Create Value"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValuesAdmin;