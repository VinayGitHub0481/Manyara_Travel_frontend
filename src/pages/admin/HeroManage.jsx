


import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Monitor,
  Package as PackageIcon,
  Plus,
  Save,
  Smartphone,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { ToastContainer,toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "../../api/axios";
import { getPackages } from "../../api/content";
import ImageUploadField from "../../components/admin/ImageUploadField";
import {
  CONTENT_POSITIONS,
  DEFAULT_CONTENT_POSITION,
  DEFAULT_OVERLAY,
  OVERLAY_OPTIONS,
  getHeroLayout,
} from "../../utils/heroLayout";


/* ============================================================
   CONSTANTS
============================================================ */

/* Values match the backend PackageTypeEnum and the Hero page. */
const PACKAGE_TYPES = [
  { value: "family", label: "Family Holidays" },
  { value: "pilgrimage", label: "Temples & Pilgrimage" },
  { value: "beach", label: "Beach Holidays" },
  { value: "mountains_adventure", label: "Mountains & Adventures" },
  { value: "romantic", label: "Romantic Getaways" },
  { value: "international", label: "International" },
  { value: "wildlife_nature", label: "Wildlife & Nature" },
];

const PACKAGE_TYPE_LABELS = Object.fromEntries(
  PACKAGE_TYPES.map((item) => [item.value, item.label]),
);

const POSITION_LABELS = Object.fromEntries(
  CONTENT_POSITIONS.map((item) => [item.value, item.label]),
);

/* Must match HERO_UPDATED_KEY in Hero.jsx. */
const HERO_UPDATED_KEY = "manyara:hero-updated";

const EMPTY_FORM = {
  image: null,
  image_mobile: null,
  image_position: "center",
  content_position: DEFAULT_CONTENT_POSITION,
  overlay_strength: DEFAULT_OVERLAY,
  badge: "",
  headline: "",
  subtext: "",
  package_type: "",
  package_id: "",
  offer_text: "",
  display_order: "",
  is_active: true,
};

const STATUS_STYLES = {
  live: {
    label: "Live",
    className: "bg-success-bg text-success",
    Icon: CheckCircle2,
  },
  scheduled: {
    label: "Starts soon",
    className: "bg-info-bg text-info",
    Icon: Clock,
  },
  expired: {
    label: "Expired",
    className: "bg-warning-bg text-warning",
    Icon: AlertCircle,
  },
  inactive: {
    label: "Inactive",
    className: "bg-card/90 text-muted",
    Icon: AlertCircle,
  },
};

/* ============================================================
   THEME CLASSES (Tailwind tokens from tailwind.config.js)
============================================================ */

const INPUT =
  "w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-text-dark outline-none transition placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

const LABEL =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary";

const CARD = "rounded-2xl border border-border bg-card shadow-travel-card";

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

/* ============================================================
   MODULE-LEVEL CACHE (stale-while-revalidate)
============================================================ */

let slidesCache = null;
let packagesCache = null;

const notifyHeroChanged = () => {
  try {
    localStorage.setItem(HERO_UPDATED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — homepage revalidates on its own timer */
  }
};

/* ============================================================
   HELPERS
============================================================ */

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image?.url || "";
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.slides)) return data.slides;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const clean = (value) => (typeof value === "string" ? value.trim() : "");

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.msg || item?.message || "Invalid input",
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof detail === "string") return detail;
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return error?.message || "Something went wrong. Please try again.";
};

const getPackageType = (pkg) =>
  String(pkg?.package_type || pkg?.type || "")
    .trim()
    .toLowerCase();

const getPackageTitle = (pkg) =>
  clean(pkg?.title) ||
  clean(pkg?.name) ||
  clean(pkg?.package_name) ||
  `Package #${pkg?.id}`;

/* Mirrors the backend: live = active and inside its schedule. */
function getSlideStatus(slide, now) {
  if (!slide.is_active) return "inactive";

  const starts = slide.starts_at ? new Date(slide.starts_at).getTime() : null;
  const ends = slide.ends_at ? new Date(slide.ends_at).getTime() : null;

  if (starts !== null && !Number.isNaN(starts) && starts > now) {
    return "scheduled";
  }
  if (ends !== null && !Number.isNaN(ends) && ends < now) return "expired";
  return "live";
}

const makeForm = (slide = null) => {
  if (!slide) return { ...EMPTY_FORM };

  return {
    image: slide.image || null,
    image_mobile: slide.image_mobile || null,
    image_position: slide.image_position || "center",
    content_position: slide.content_position || DEFAULT_CONTENT_POSITION,
    overlay_strength: slide.overlay_strength || DEFAULT_OVERLAY,
    badge: slide.badge || "",
    headline: slide.headline || "",
    subtext: slide.subtext || "",
    package_type: slide.package_type || "",
    package_id: slide.package_id ? String(slide.package_id) : "",
    offer_text: slide.offer_text || "",
    display_order: slide.display_order ?? "",
    is_active: slide.is_active !== false,
  };
};

/* ============================================================
   CONTENT POSITION PICKER (3 x 3 grid)
============================================================ */

function PositionPicker({ value, onChange, disabled }) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Content position"
        className="grid w-full max-w-[220px] grid-cols-3 gap-1.5 rounded-xl border border-border bg-card p-1.5"
      >
        {CONTENT_POSITIONS.map((item) => {
          const selected = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={item.label}
              title={item.label}
              disabled={disabled}
              onClick={() => onChange(item.value)}
              className={`flex aspect-[4/3] items-center justify-center rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-primary bg-primary-lighter"
                  : "border-divider bg-surface hover:border-primary/40 hover:bg-surface-soft"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selected ? "bg-primary" : "bg-border-strong"
                }`}
              />
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted">
        Text block:{" "}
        <strong className="text-text-dark">
          {POSITION_LABELS[value] || "Middle left"}
        </strong>
      </p>
    </div>
  );
}

/* ============================================================
   LIVE PREVIEW

   Uses the same getHeroLayout() as the homepage hero.
============================================================ */

function HeroPreview({
  form,
  device,
  categoryLabel,
  packageLabel,
}) {
  const layout = getHeroLayout(form.content_position, form.overlay_strength);
  const isMobile = device === "mobile";

  const imageUrl = isMobile
    ? getImageUrl(form.image_mobile) || getImageUrl(form.image)
    : getImageUrl(form.image);

  return (
    <div
      className={`relative overflow-hidden bg-ink ${
        isMobile
          ? "mx-auto aspect-[9/16] max-h-[26rem] w-full max-w-[15rem] rounded-2xl"
          : "aspect-[16/7] w-full"
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: form.image_position || "center" }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white/50">
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 h-8 w-8" />
            <p className="text-xs">Hero preview</p>
          </div>
        </div>
      )}

      {layout.overlay && (
        <div
          className={`absolute inset-0 ${layout.overlay}`}
          aria-hidden="true"
        />
      )}

      <div
        className={`absolute inset-0 flex flex-col text-white ${layout.wrapper} ${
          isMobile ? "p-4" : "p-5 sm:p-7"
        }`}
      >
        <div
          className={`flex flex-col ${layout.text} ${
            isMobile ? "max-w-full" : "max-w-md"
          }`}
        >
          {form.badge && (
            <span className="mb-2 w-fit rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
              {form.badge}
            </span>
          )}

          <h3
            className={`font-display font-semibold leading-tight ${
              isMobile ? "text-lg" : "text-2xl sm:text-3xl"
            }`}
          >
            {form.headline || "Your hero headline"}
          </h3>

          {form.subtext && (
            <p
              className={`mt-2 text-white/85 ${
                isMobile ? "line-clamp-3 text-[11px]" : "line-clamp-2 text-xs sm:text-sm"
              }`}
            >
              {form.subtext}
            </p>
          )}

          {(categoryLabel || packageLabel) && (
            <div className={`mt-3 flex flex-wrap gap-2 ${layout.actions}`}>
              {categoryLabel && (
                <span className="inline-flex w-fit rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold">
                  Explore {categoryLabel}
                </span>
              )}

              {packageLabel && (
                <span className="inline-flex w-fit max-w-[12rem] truncate rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-[11px] font-semibold backdrop-blur">
                  View {packageLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function HeroManage() {
  const [slides, setSlides] = useState(() => slidesCache || []);
  const [packages, setPackages] = useState(() => packagesCache || []);
  const [loading, setLoading] = useState(() => slidesCache === null);
  const [packagesLoading, setPackagesLoading] = useState(
    () => packagesCache === null,
  );
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [uploading, setUploading] = useState({
    image: false,
    image_mobile: false,
  });

  const [now, setNow] = useState(() => Date.now());

  const isEditing = editingId !== null;
  const uploadBusy = uploading.image || uploading.image_mobile;

  const sortedSlides = useMemo(
    () =>
      [...slides].sort(
        (a, b) =>
          Number(a.display_order || 999999) - Number(b.display_order || 999999),
      ),
    [slides],
  );

  /* ---------------- Data loading (cached) ---------------- */

  const loadSlides = useCallback(async () => {
    try {
      const response = await api.get("/hero/admin/all");
      const list = normalizeList(response.data);
      slidesCache = list;
      setSlides(list);
      setNow(Date.now());
    } catch (error) {
      toast.error(getErrorMessage(error), { toastId: "hero-load-error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      const response = await getPackages();
      const list = normalizeList(response?.data ?? response);
      packagesCache = list;
      setPackages(list);
    } catch (error) {
      toast.error(`Could not load packages: ${getErrorMessage(error)}`, {
        toastId: "hero-packages-error",
      });
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
    loadPackages();
  }, [loadSlides, loadPackages]);

  /* Keep the Live / Expired badges honest while the page stays open. */
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  /* Packages that belong to the category chosen in the form. */
  const packageOptions = useMemo(
    () =>
      form.package_type
        ? packages.filter((pkg) => getPackageType(pkg) === form.package_type)
        : [],
    [packages, form.package_type],
  );

  const packageById = useMemo(
    () => new Map(packages.map((pkg) => [Number(pkg.id), pkg])),
    [packages],
  );

  const selectedPackage = form.package_id
    ? packageById.get(Number(form.package_id))
    : null;

  /* ---------------- Form handling ---------------- */

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setPreviewDevice("desktop");
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (slide) => {
    setEditingId(slide.id);
    setForm(makeForm(slide));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    if (saving || uploadBusy) return;
    setFormOpen(false);
    resetForm();
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  /* Changing the category clears the package: it must match the category. */
  const handleCategoryChange = (value) => {
    setForm((current) => ({
      ...current,
      package_type: value,
      package_id: "",
    }));
  };

  const buildPayload = () => {
    const payload = {
      image: form.image,
      image_mobile: form.image_mobile || null,
      image_position: clean(form.image_position) || "center",
      content_position: form.content_position || DEFAULT_CONTENT_POSITION,
      overlay_strength: form.overlay_strength || DEFAULT_OVERLAY,
      badge: clean(form.badge) || null,
      headline: clean(form.headline),
      subtext: clean(form.subtext) || null,
      package_type: form.package_type || null,
      package_id: form.package_id ? Number(form.package_id) : null,
      offer_text: clean(form.offer_text) || null,
      is_active: Boolean(form.is_active),
    };

    if (form.display_order !== "" && form.display_order !== null) {
      payload.display_order = Number(form.display_order);
    }

    return payload;
  };

  const validateForm = () => {
    if (!form.image?.url) {
      toast.error("Desktop hero image is required.");
      return false;
    }

    if (!clean(form.headline)) {
      toast.error("Hero headline is required.");
      return false;
    }

    if (form.package_id && !form.package_type) {
      toast.error("Choose a travel category before choosing a package.");
      return false;
    }

    return true;
  };

  /* ---------------- Actions ---------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || uploadBusy || !validateForm()) return;

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEditing) {
        await api.put(`/hero/admin/${editingId}`, payload);
        toast.success("Hero slide updated.");
      } else {
        await api.post("/hero/admin", payload);
        toast.success("Hero slide created.");
      }

      notifyHeroChanged();
      setFormOpen(false);
      resetForm();
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slide) => {
    if (deletingId || saving || uploadBusy) return;

    const confirmed = window.confirm(
      `Delete hero slide #${slide.display_order || slide.id}? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(slide.id);

    try {
      await api.delete(`/hero/admin/${slide.id}`);
      toast.success("Hero slide deleted.");
      notifyHeroChanged();
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  /* The backend is the source of truth: we send the target position
     and it shifts the other slides. */
  const moveSlide = async (slide, direction) => {
    if (busyId) return;

    const currentIndex = sortedSlides.findIndex((item) => item.id === slide.id);
    if (currentIndex < 0) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;

    const targetOrder = sortedSlides[targetIndex].display_order;

    setBusyId(slide.id);

    try {
      await api.put(`/hero/admin/${slide.id}`, { display_order: targetOrder });
      toast.success(`Slide moved to position ${targetOrder}.`);
      notifyHeroChanged();
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (slide) => {
    if (busyId) return;

    setBusyId(slide.id);

    try {
      await api.put(`/hero/admin/${slide.id}`, {
        is_active: !slide.is_active,
      });

      toast.success(slide.is_active ? "Slide deactivated." : "Slide activated.");
      notifyHeroChanged();
      await loadSlides();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  /* ---------------- Preview labels (match Hero.jsx) ---------------- */

  const previewCategoryLabel = PACKAGE_TYPE_LABELS[form.package_type] || "";
  const previewPackageLabel = form.package_id
    ? selectedPackage
      ? getPackageTitle(selectedPackage)
      : `Package #${form.package_id}`
    : "";

  /* ============================================================
     RENDER
  ============================================================ */

  return (

    <>
      <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />

    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Website Content
            </p>
            <h1 className="font-display text-3xl font-semibold text-text-dark">
              Hero Slides
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Manage the homepage hero images, text position, messaging,
              package buttons, visibility and display order.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className={`${PRIMARY_BUTTON} py-3`}
          >
            <Plus className="h-4 w-4" />
            Add Hero Slide
          </button>
        </div>

        {/* Form */}
        {formOpen && (
          <form onSubmit={handleSubmit} className={`${CARD} mb-7 overflow-hidden`}>
            <div className="border-b border-border bg-gradient-to-r from-card to-surface-soft px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-text-dark">
                    {isEditing ? "Edit Hero Slide" : "Create Hero Slide"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Desktop image and headline are required. Everything else is
                    optional.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving || uploadBusy}
                  className="rounded-full p-2 text-text-secondary transition hover:bg-surface-soft hover:text-text-dark disabled:opacity-50"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.05fr_1fr]">
              {/* Media + preview */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-text-dark">Hero Images</h3>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <ImageUploadField
                      label="Desktop Image *"
                      value={form.image}
                      onChange={(value) => updateField("image", value)}
                      onBusyChange={(busy) =>
                        setUploading((current) => ({ ...current, image: busy }))
                      }
                      disabled={saving}
                      maxSizeMB={5}
                    />

                    <ImageUploadField
                      label="Mobile Image"
                      value={form.image_mobile}
                      onChange={(value) => updateField("image_mobile", value)}
                      onBusyChange={(busy) =>
                        setUploading((current) => ({
                          ...current,
                          image_mobile: busy,
                        }))
                      }
                      disabled={saving}
                      maxSizeMB={5}
                    />
                  </div>

                  <div className="mt-5">
                    <label className={LABEL}>Image Focus</label>
                    <select
                      className={INPUT}
                      value={form.image_position}
                      onChange={(e) =>
                        updateField("image_position", e.target.value)
                      }
                      disabled={saving}
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top left">Top Left</option>
                      <option value="top right">Top Right</option>
                      <option value="bottom left">Bottom Left</option>
                      <option value="bottom right">Bottom Right</option>
                    </select>
                    <p className="mt-1.5 text-[11px] text-muted">
                      Which part of the photo stays in view when it is cropped.
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Live preview
                    </p>

                    <div
                      role="group"
                      aria-label="Preview device"
                      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
                    >
                      {[
                        { value: "desktop", label: "Desktop", Icon: Monitor },
                        { value: "mobile", label: "Mobile", Icon: Smartphone },
                      ].map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPreviewDevice(value)}
                          aria-pressed={previewDevice === value}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                            previewDevice === value
                              ? "bg-card text-primary shadow-sm"
                              : "text-text-secondary hover:text-text-dark"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-strong p-3">
                    <HeroPreview
                      form={form}
                      device={previewDevice}
                      categoryLabel={previewCategoryLabel}
                      packageLabel={previewPackageLabel}
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-5">
                {/* Layout controls */}
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-text-dark">
                      Text layout
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      Place the text where it does not cover the important part
                      of the photo.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
                    <div>
                      <label className={LABEL}>Content Position</label>
                      <PositionPicker
                        value={form.content_position}
                        onChange={(value) => updateField("content_position", value)}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className={LABEL}>Image Overlay</label>
                      <div
                        role="radiogroup"
                        aria-label="Image overlay strength"
                        className="grid grid-cols-4 gap-1.5"
                      >
                        {OVERLAY_OPTIONS.map((item) => {
                          const selected = form.overlay_strength === item.value;

                          return (
                            <button
                              key={item.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              disabled={saving}
                              onClick={() =>
                                updateField("overlay_strength", item.value)
                              }
                              className={`rounded-lg border px-2 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 ${
                                selected
                                  ? "border-primary bg-primary-lighter text-primary"
                                  : "border-border bg-card text-text-secondary hover:border-primary/40"
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        A dark shade behind the text so it stays readable. Use
                        “None” for a dark photo, “Strong” for a bright one.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Badge</label>
                  <input
                    className={INPUT}
                    value={form.badge}
                    onChange={(e) => updateField("badge", e.target.value)}
                    placeholder="e.g. Summer Escape"
                    maxLength={40}
                    disabled={saving}
                  />
                </div>

                <div>
                  <div className="flex items-end justify-between">
                    <label className={LABEL}>Headline *</label>
                    <span
                      className={`mb-1.5 text-[11px] ${
                        form.headline.length > 80 ? "text-warning" : "text-muted"
                      }`}
                    >
                      {form.headline.length}/80 recommended
                    </span>
                  </div>
                  <textarea
                    className={`${INPUT} min-h-[92px] resize-y`}
                    value={form.headline}
                    onChange={(e) => updateField("headline", e.target.value)}
                    placeholder="Discover your next unforgettable journey"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-end justify-between">
                    <label className={LABEL}>Subtext</label>
                    <span
                      className={`mb-1.5 text-[11px] ${
                        form.subtext.length > 160 ? "text-warning" : "text-muted"
                      }`}
                    >
                      {form.subtext.length}/160 recommended
                    </span>
                  </div>
                  <textarea
                    className={`${INPUT} min-h-[86px] resize-y`}
                    value={form.subtext}
                    onChange={(e) => updateField("subtext", e.target.value)}
                    placeholder="Short supporting message for the hero section"
                    disabled={saving}
                  />
                </div>

                {/* Buttons shown on the homepage hero */}
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-text-dark">
                      Hero buttons
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      The category becomes an “Explore” button. A specific
                      package adds a second button next to it.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`${LABEL} flex items-center gap-1.5`}>
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        Travel Category
                      </label>
                      <select
                        className={INPUT}
                        value={form.package_type}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        disabled={saving}
                      >
                        <option value="">No category button</option>
                        {PACKAGE_TYPES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`${LABEL} flex items-center gap-1.5`}>
                        <PackageIcon className="h-3.5 w-3.5 text-primary" />
                        Specific Package (optional)
                      </label>
                      <select
                        className={INPUT}
                        value={form.package_id}
                        onChange={(e) => updateField("package_id", e.target.value)}
                        disabled={saving || !form.package_type}
                      >
                        <option value="">
                          {!form.package_type
                            ? "Choose a category first"
                            : packagesLoading
                              ? "Loading packages..."
                              : "No package button"}
                        </option>

                        {/* Keep the saved package selectable while the list loads. */}
                        {form.package_id &&
                          !packageOptions.some(
                            (pkg) => String(pkg.id) === form.package_id,
                          ) && (
                            <option value={form.package_id}>
                              Package #{form.package_id} (current)
                            </option>
                          )}

                        {packageOptions.map((pkg) => (
                          <option key={pkg.id} value={String(pkg.id)}>
                            {getPackageTitle(pkg)}
                          </option>
                        ))}
                      </select>

                      {form.package_type &&
                        !packagesLoading &&
                        packageOptions.length === 0 && (
                          <p className="mt-1.5 text-[11px] text-muted">
                            No packages found in this category yet.
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Offer Text</label>
                    <input
                      className={INPUT}
                      value={form.offer_text}
                      onChange={(e) => updateField("offer_text", e.target.value)}
                      placeholder="Starting from ₹18,999"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Display Order</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={INPUT}
                      value={form.display_order}
                      onChange={(e) =>
                        updateField("display_order", e.target.value)
                      }
                      placeholder="Auto / last"
                      disabled={saving}
                    />
                    <p className="mt-1.5 text-[11px] text-muted">
                      Other slides shift automatically.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Visibility</label>
                  <button
                    type="button"
                    onClick={() => updateField("is_active", !form.is_active)}
                    disabled={saving}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                      form.is_active
                        ? "border-success/30 bg-success-bg text-success"
                        : "border-border bg-surface text-muted"
                    }`}
                  >
                    <span>{form.is_active ? "Active" : "Inactive"}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        form.is_active ? "bg-success" : "bg-placeholder"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving || uploadBusy}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-soft disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || uploadBusy}
                className={PRIMARY_BUTTON}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? "Save Changes" : "Create Slide"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <section className={CARD}>
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-text-dark">All Hero Slides</h2>
              <p className="text-xs text-muted">
                {slides.length} slide{slides.length === 1 ? "" : "s"} • ordered
                by display position
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-medium text-text-secondary">
              <GripVertical className="h-3.5 w-3.5" />
              Order controlled by backend
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted">Loading hero slides...</p>
              </div>
            </div>
          ) : sortedSlides.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-2xl bg-surface-soft p-4">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-text-dark">
                No hero slides yet
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted">
                Add a slide with a desktop image and headline. Until then the
                homepage shows its default hero.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className={`${PRIMARY_BUTTON} mt-5`}
              >
                <Plus className="h-4 w-4" />
                Add First Slide
              </button>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {sortedSlides.map((slide, index) => {
                const imageUrl = getImageUrl(slide.image);
                const isDeleting = deletingId === slide.id;
                const isBusy = busyId === slide.id;
                const isFirst = index === 0;
                const isLast = index === sortedSlides.length - 1;

                const status = STATUS_STYLES[getSlideStatus(slide, now)];
                const StatusIcon = status.Icon;

                const categoryLabel = PACKAGE_TYPE_LABELS[slide.package_type];
                const linkedPackage = slide.package_id
                  ? packageById.get(Number(slide.package_id))
                  : null;

                const positionLabel =
                  POSITION_LABELS[slide.content_position] || "Middle left";

                return (
                  <article
                    key={slide.id}
                    className="p-4 transition hover:bg-surface-soft/40 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      {/* Order */}
                      <div className="flex items-center gap-3 lg:w-28 lg:flex-col lg:justify-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white">
                          {slide.display_order}
                        </div>

                        <div className="flex lg:flex-col">
                          <button
                            type="button"
                            disabled={isFirst || Boolean(busyId)}
                            onClick={() => moveSlide(slide, "up")}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-soft hover:text-text-dark disabled:cursor-not-allowed disabled:opacity-25"
                            title="Move up"
                            aria-label="Move slide up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isLast || Boolean(busyId)}
                            onClick={() => moveSlide(slide, "down")}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-soft hover:text-text-dark disabled:cursor-not-allowed disabled:opacity-25"
                            title="Move down"
                            aria-label="Move slide down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image */}
                      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl bg-surface-soft sm:aspect-[16/6] lg:w-[360px] lg:shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: slide.image_position || "center",
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-placeholder">
                            <ImageIcon className="h-7 w-7" />
                          </div>
                        )}

                        <div className="absolute left-2 top-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${status.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {slide.badge && (
                            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                              {slide.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 line-clamp-2 font-display text-xl font-semibold leading-tight text-text-dark">
                          {slide.headline || "Untitled hero slide"}
                        </h3>

                        {slide.subtext && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                            {slide.subtext}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-text-secondary">
                            Text: <strong>{positionLabel}</strong>
                          </span>

                          {categoryLabel && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-text-secondary">
                              <Tag className="h-3 w-3 text-primary" />
                              Button: <strong>{categoryLabel}</strong>
                            </span>
                          )}

                          {slide.package_id && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-text-secondary">
                              <PackageIcon className="h-3 w-3 text-primary" />
                              Package:{" "}
                              <strong>
                                {linkedPackage
                                  ? getPackageTitle(linkedPackage)
                                  : `#${slide.package_id}`}
                              </strong>
                            </span>
                          )}

                          {slide.offer_text && (
                            <span className="rounded-lg bg-surface-soft px-2.5 py-1.5 font-medium text-primary">
                              {slide.offer_text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2 border-t border-divider pt-3 lg:border-0 lg:pt-0">
                        <button
                          type="button"
                          onClick={() => toggleActive(slide)}
                          disabled={Boolean(busyId)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            slide.is_active
                              ? "border-success/30 bg-success-bg text-success hover:bg-success-bg/70"
                              : "border-border bg-card text-text-secondary hover:bg-surface"
                          }`}
                        >
                          {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {slide.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(slide)}
                          className={SECONDARY_BUTTON}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(slide)}
                          disabled={isDeleting || Boolean(busyId)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-error/20 bg-error-bg px-3 py-2 text-xs font-semibold text-error transition hover:bg-error-bg/70 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  </>
  );
}

















