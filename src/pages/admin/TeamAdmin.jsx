

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

import api from "../../api/axios";
import ImageUploadField from "../../components/admin/ImageUploadField";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const EMPTY_FORM = {
  name: "",
  designation: "",
  department: "",
  short_description: "",
  full_description: "",
  image: null,
  email: "",
  phone: "",
  whatsapp: "",
  experience_years: "",
  linkedin: "",
  instagram: "",
  display_order: 0,
  is_active: true,
  show_public_profile: false,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object" && image.url) {
    return image.url;
  }

  return "";
}

function normalizeImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    return {
      url: image.trim(),
      public_id: "",
    };
  }

  if (typeof image === "object" && image.url) {
    return {
      url: String(image.url).trim(),
      public_id: String(image.public_id || "").trim(),
    };
  }

  return null;
}

/**
 * Builds the { url, public_id } object stored in the database.
 * Returns null when no image is selected.
 */
function buildImagePayload(image) {
  const normalized = normalizeImage(image);

  if (!normalized?.url) {
    return null;
  }

  return normalized;
}

function normalizeTeamMember(item) {
  return {
    id: item?.id,
    name: item?.name || "",
    slug: item?.slug || "",
    designation: item?.designation || "",
    department: item?.department || "",
    short_description: item?.short_description || "",
    full_description: item?.full_description || "",
    image: normalizeImage(item?.image),
    email: item?.email || "",
    phone: item?.phone || "",
    whatsapp: item?.whatsapp || "",
    experience_years:
      item?.experience_years === null ||
      item?.experience_years === undefined
        ? ""
        : item.experience_years,
    linkedin: item?.linkedin || "",
    instagram: item?.instagram || "",
    display_order:
      item?.display_order === null ||
      item?.display_order === undefined
        ? 0
        : item.display_order,
    is_active:
      item?.is_active === undefined ? true : Boolean(item.is_active),
    show_public_profile:
      item?.show_public_profile === undefined
        ? false
        : Boolean(item.show_public_profile),
  };
}

function sortTeamMembers(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.display_order || 0);
    const orderB = Number(b.display_order || 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function isValidUrl(value) {
  if (!value?.trim()) return true;

  try {
    const url = new URL(value.trim());

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getWhatsAppUrl(value) {
  if (!value) return "";

  const trimmed = String(value).trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  return digits ? `https://wa.me/${digits}` : "";
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-navy">
      {children}

      {required && (
        <span className="ml-1 text-accent" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function TextInput({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  step,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function TextArea({
  label,
  required = false,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <textarea
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function SocialLink({ href, icon: Icon, label }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-navy transition hover:border-accent hover:text-accent"
    >
      <Icon size={16} />
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Image field (Cloudinary upload)                                            */
/* -------------------------------------------------------------------------- */

function ImageField({ image, onChange }) {
  const imageUrl = getImageUrl(image);
  const publicId =
    typeof image === "object" ? image?.public_id || "" : "";

  /*
   * ImageUploadField returns the Cloudinary upload result.
   * Only the URL and public ID are kept, so the backend stores:
   * {
   *   url: "...",
   *   public_id: "..."
   * }
   */
  const handleUpload = (uploadedImage) => {
    if (!uploadedImage) {
      onChange(null);
      return;
    }

    onChange({
      url: uploadedImage?.url || uploadedImage?.secure_url || "",
      public_id: uploadedImage?.public_id || "",
    });
  };

  const removeImage = () => {
    onChange(null);
  };

  return (
    <div>
      <FieldLabel>Profile image</FieldLabel>

      <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4">
        {imageUrl ? (
          <div className="space-y-4">
            {/* Current image */}

            <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
              <img
                src={imageUrl}
                alt="Team member preview"
                className="h-56 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <button
                type="button"
                onClick={removeImage}
                title="Remove image"
                aria-label="Remove profile image"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition hover:bg-white"
              >
                <X size={17} />
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-navy">
                Profile image added
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                The image is stored in Cloudinary. You can replace it
                with another image.
              </p>
            </div>

            {/* Replace image */}

            <ImageUploadField
              value={null}
              onChange={handleUpload}
              label="Replace profile image"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <FieldLabel>Image URL</FieldLabel>

                <p className="break-all rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs leading-5 text-slate-600">
                  {imageUrl}
                </p>
              </div>

              <div className="min-w-0">
                <FieldLabel>Cloudinary public ID</FieldLabel>

                <p className="break-all rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs leading-5 text-slate-600">
                  {publicId || "Not available"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-navy">
                Add profile image
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Optional. Upload an image to Cloudinary. The returned
                URL and public ID will be saved with this team member.
              </p>
            </div>

            <ImageUploadField
              value={null}
              onChange={handleUpload}
              label="Add profile image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function TeamAdmin() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load                                                                    */
  /* ------------------------------------------------------------------------ */

  const loadTeamMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/about/admin/team");
      const data = response?.data;

      let records = [];

      if (Array.isArray(data)) {
        records = data;
      } else if (Array.isArray(data?.items)) {
        records = data.items;
      } else if (Array.isArray(data?.team)) {
        records = data.team;
      } else if (Array.isArray(data?.data)) {
        records = data.data;
      }

      setMembers(
        sortTeamMembers(records.map(normalizeTeamMember))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setError("");
    setSuccess("");
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (member) => {
    setError("");
    setSuccess("");

    setForm({
      name: member.name || "",
      designation: member.designation || "",
      department: member.department || "",
      short_description: member.short_description || "",
      full_description: member.full_description || "",
      image: normalizeImage(member.image),
      email: member.email || "",
      phone: member.phone || "",
      whatsapp: member.whatsapp || "",
      experience_years:
        member.experience_years === null ||
        member.experience_years === undefined
          ? ""
          : member.experience_years,
      linkedin: member.linkedin || "",
      instagram: member.instagram || "",
      display_order: member.display_order ?? 0,
      is_active:
        member.is_active === undefined
          ? true
          : Boolean(member.is_active),
      show_public_profile:
        member.show_public_profile === undefined
          ? false
          : Boolean(member.show_public_profile),
    });

    setEditingId(member.id);
    setShowForm(true);
  };

  /* ------------------------------------------------------------------------ */
  /* Validation                                                               */
  /* ------------------------------------------------------------------------ */

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Name is required.";
    }

    if (!form.designation.trim()) {
      return "Designation is required.";
    }

    if (
      form.experience_years !== "" &&
      (
        !Number.isInteger(Number(form.experience_years)) ||
        Number(form.experience_years) < 0
      )
    ) {
      return "Experience years must be a whole number of 0 or greater.";
    }

    if (
      !Number.isInteger(Number(form.display_order)) ||
      Number(form.display_order) < 0
    ) {
      return "Display order must be a whole number of 0 or greater.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      return "Please enter a valid email address.";
    }

    if (!isValidUrl(form.linkedin)) {
      return "Please enter a valid LinkedIn URL.";
    }

    if (!isValidUrl(form.instagram)) {
      return "Please enter a valid Instagram URL.";
    }

    if (form.image?.url && !isValidUrl(form.image.url)) {
      return "The uploaded image URL is not valid. Please upload the image again.";
    }

    return "";
  };

  /* ------------------------------------------------------------------------ */
  /* Payload                                                                  */
  /* ------------------------------------------------------------------------ */

  const buildPayload = () => ({
    name: form.name.trim(),
    designation: form.designation.trim(),
    department: form.department.trim() || null,
    short_description:
      form.short_description.trim() || null,
    full_description:
      form.full_description.trim() || null,

    /* Stored in the database as { url, public_id } */
    image: buildImagePayload(form.image),

    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    whatsapp: form.whatsapp.trim() || null,

    experience_years:
      form.experience_years === ""
        ? null
        : Number(form.experience_years),

    linkedin: form.linkedin.trim() || null,
    instagram: form.instagram.trim() || null,

    display_order: Number(form.display_order) || 0,

    is_active: Boolean(form.is_active),
    show_public_profile: Boolean(form.show_public_profile),
  });

  /* ------------------------------------------------------------------------ */
  /* Create / update                                                          */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (editingId !== null) {
        await api.put(
          `/about/admin/team/${editingId}`,
          payload
        );

        setSuccess("Team member updated successfully.");
      } else {
        await api.post(
          "/about/admin/team",
          payload
        );

        setSuccess("Team member created successfully.");
      }

      resetForm();
      await loadTeamMembers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Toggle helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const updateMember = async (member, changes) => {
    setError("");
    setSuccess("");
    setTogglingId(member.id);

    try {
      const payload = {
        name: member.name,
        designation: member.designation,

        department: member.department || null,
        short_description:
          member.short_description || null,
        full_description:
          member.full_description || null,

        image: buildImagePayload(member.image),

        email: member.email || null,
        phone: member.phone || null,
        whatsapp: member.whatsapp || null,

        experience_years:
          member.experience_years === "" ||
          member.experience_years === null ||
          member.experience_years === undefined
            ? null
            : Number(member.experience_years),

        linkedin: member.linkedin || null,
        instagram: member.instagram || null,

        display_order:
          Number(member.display_order) || 0,

        is_active: Boolean(
          changes.is_active ?? member.is_active
        ),

        show_public_profile: Boolean(
          changes.show_public_profile ??
            member.show_public_profile
        ),
      };

      await api.put(
        `/about/admin/team/${member.id}`,
        payload
      );

      await loadTeamMembers();

      if (changes.is_active !== undefined) {
        setSuccess(
          changes.is_active
            ? "Team member activated."
            : "Team member hidden from the public site."
        );
      }

      if (changes.show_public_profile !== undefined) {
        setSuccess(
          changes.show_public_profile
            ? "Public profile page enabled."
            : "Public profile page disabled."
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleActive = (member) => {
    updateMember(member, {
      is_active: !member.is_active,
    });
  };

  const handleTogglePublicProfile = (member) => {
    updateMember(member, {
      show_public_profile: !member.show_public_profile,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Delete "${member.name}" permanently?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(member.id);

    try {
      await api.delete(
        `/about/admin/team/${member.id}`
      );

      setSuccess("Team member deleted successfully.");

      await loadTeamMembers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Stats                                                                    */
  /* ------------------------------------------------------------------------ */

  const activeCount = members.filter(
    (member) => member.is_active
  ).length;

  const publicProfileCount = members.filter(
    (member) =>
      member.is_active &&
      member.show_public_profile
  ).length;

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <UserRound size={15} />
            About CMS
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Team Members
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage employees and team profiles displayed
            on the public About page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/about/team"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-navy hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            View public team
          </Link>

          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
          >
            <Plus size={17} />
            Add team member
          </button>
        </div>
      </div>

      {/* About CMS navigation */}

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-border bg-white p-2 shadow-sm">
        <Link
          to="/admin/dashboard/about"
          className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-slate-50 hover:text-navy"
        >
          Main About
        </Link>

        <Link
          to="/admin/dashboard/about/leadership"
          className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-slate-50 hover:text-navy"
        >
          Leadership
        </Link>

        <Link
          to="/admin/dashboard/about/team"
          className="whitespace-nowrap rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-accent"
        >
          Team
        </Link>

        <Link
          to="/admin/dashboard/about/milestones"
          className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-slate-50 hover:text-navy"
        >
          Milestones
        </Link>

        <Link
          to="/admin/dashboard/about/values"
          className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-slate-50 hover:text-navy"
        >
          Values
        </Link>
      </div>

      {/* Error */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={18}
          />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-0.5 leading-5">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check
            className="mt-0.5 shrink-0"
            size={18}
          />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Success
            </p>

            <p className="mt-0.5 leading-5">
              {success}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Close success message"
            className="shrink-0 rounded-lg p-1 hover:bg-green-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total members"
          value={members.length}
          icon={UsersIcon}
        />

        <StatCard
          label="Active"
          value={activeCount}
          icon={Check}
          valueClass="text-green-600"
        />

        <StatCard
          label="Public profiles"
          value={publicProfileCount}
          icon={ExternalLink}
          valueClass="text-accent"
        />
      </div>

      {/* List */}

      {loading ? (
        <div className="rounded-3xl border border-border bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-sm text-muted">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading team members...
          </div>
        </div>
      ) : members.length === 0 ? (
        <EmptyState onAdd={startCreate} />
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              togglingId={togglingId}
              deletingId={deletingId}
              onEdit={startEdit}
              onToggleActive={handleToggleActive}
              onToggleProfile={
                handleTogglePublicProfile
              }
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}

      {showForm && (
        <TeamMemberModal
          form={form}
          editingId={editingId}
          saving={saving}
          updateField={updateField}
          onSubmit={handleSubmit}
          onClose={resetForm}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

function UsersIcon(props) {
  return <UserRound {...props} />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass = "text-navy",
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>

        <Icon
          size={17}
          className="text-muted"
        />
      </div>

      <p
        className={`mt-1 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-accent">
        <UserRound size={25} />
      </div>

      <h2 className="mt-4 font-display text-xl font-semibold text-navy">
        No team members yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Add your employees and team members to build
        the public About → Team section.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
      >
        <Plus size={17} />
        Add team member
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Team member card                                                           */
/* -------------------------------------------------------------------------- */

function TeamMemberCard({
  member,
  togglingId,
  deletingId,
  onEdit,
  onToggleActive,
  onToggleProfile,
  onDelete,
}) {
  const imageUrl = getImageUrl(member.image);
  const whatsappUrl = getWhatsAppUrl(
    member.whatsapp
  );

  const isToggling = togglingId === member.id;
  const isDeleting = deletingId === member.id;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Image */}

          <div className="shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={member.name}
                className="h-28 w-28 rounded-2xl object-cover ring-1 ring-border sm:h-32 sm:w-32"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                  event.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}

            <div
              className={`flex h-28 w-28 items-center justify-center rounded-2xl bg-navy text-2xl font-bold text-white sm:h-32 sm:w-32 ${
                imageUrl ? "hidden" : ""
              }`}
            >
              {member.name
                ?.trim()
                ?.charAt(0)
                ?.toUpperCase() || "T"}
            </div>
          </div>

          {/* Content */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      member.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {member.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  {member.show_public_profile && (
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-accent">
                      Public profile
                    </span>
                  )}

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    Order: {member.display_order}
                  </span>
                </div>

                <h2 className="truncate font-display text-xl font-semibold text-navy">
                  {member.name}
                </h2>

                <p className="mt-1 text-sm font-semibold text-accent">
                  {member.designation}
                </p>

                {member.department && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <BriefcaseBusiness size={13} />
                    {member.department}
                  </p>
                )}
              </div>

              {/* Actions */}

              <div className="flex shrink-0 flex-wrap gap-2">
                <ActionButton
                  icon={<Edit3 size={14} />}
                  label="Edit"
                  onClick={() => onEdit(member)}
                  disabled={
                    isToggling || isDeleting
                  }
                />

                <ActionButton
                  label={
                    member.is_active
                      ? "Deactivate"
                      : "Activate"
                  }
                  onClick={() =>
                    onToggleActive(member)
                  }
                  disabled={
                    isToggling || isDeleting
                  }
                  className={
                    member.is_active
                      ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }
                  loading={
                    isToggling &&
                    !isDeleting
                  }
                />

                <ActionButton
                  label={
                    member.show_public_profile
                      ? "Hide profile"
                      : "Show profile"
                  }
                  onClick={() =>
                    onToggleProfile(member)
                  }
                  disabled={
                    isToggling || isDeleting
                  }
                  className={
                    member.show_public_profile
                      ? "border-orange-200 text-accent hover:bg-orange-50"
                      : "border-border text-slate-600 hover:bg-slate-50"
                  }
                  loading={
                    isToggling &&
                    !isDeleting
                  }
                />

                <ActionButton
                  icon={
                    isDeleting ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={14} />
                    )
                  }
                  label="Delete"
                  onClick={() => onDelete(member)}
                  disabled={
                    isDeleting || isToggling
                  }
                  className="border-red-200 text-red-600 hover:bg-red-50"
                />
              </div>
            </div>

            {/* Description */}

            {member.short_description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                {member.short_description}
              </p>
            )}

            {/* Details */}

            <div className="mt-4 flex flex-wrap gap-2">
              {member.experience_years !== "" &&
                member.experience_years !== null &&
                member.experience_years !==
                  undefined && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                    <BriefcaseBusiness size={13} />

                    {member.experience_years}{" "}
                    {Number(
                      member.experience_years
                    ) === 1
                      ? "year"
                      : "years"}{" "}
                    experience
                  </span>
                )}

              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-accent"
                >
                  <Mail size={13} />
                  Email
                </a>
              )}

              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-accent"
                >
                  <Phone size={13} />
                  Phone
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-green-600"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              )}
            </div>

            {/* Social */}

            {(member.linkedin ||
              member.instagram) && (
              <div className="mt-4 flex gap-2">
                <SocialLink
                  href={member.linkedin}
                  icon={FaLinkedinIn}
                  label="LinkedIn"
                />

                <SocialLink
                  href={member.instagram}
                  icon={FaInstagram}
                  label="Instagram"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action button                                                              */
/* -------------------------------------------------------------------------- */

function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2
          size={14}
          className="animate-spin"
        />
      ) : (
        icon
      )}

      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                     */
/* -------------------------------------------------------------------------- */

function TeamMemberModal({
  form,
  editingId,
  saving,
  updateField,
  onSubmit,
  onClose,
}) {
  const isEditing = editingId !== null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}

      <div
        className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div className="relative flex min-h-full items-start justify-center p-3 sm:p-5 lg:p-8">
        <div className="relative my-4 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-8">
          {/* Header */}

          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                Team CMS
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold text-navy sm:text-2xl">
                {isEditing
                  ? "Edit team member"
                  : "Add team member"}
              </h2>

              <p className="mt-1 text-xs text-muted">
                The profile slug is generated
                automatically from the name.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close form"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-slate-50 hover:text-navy disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </div>

          {/* Form */}

          <form onSubmit={onSubmit}>
            <div className="max-h-[calc(100vh-170px)] overflow-y-auto px-5 py-6 sm:px-6">
              <div className="space-y-7">
                {/* Basic */}

                <section>
                  <SectionHeading
                    title="Basic information"
                    description="Name and professional role."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Name"
                      required
                      value={form.name}
                      onChange={(event) =>
                        updateField(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Employee name"
                    />

                    <TextInput
                      label="Designation"
                      required
                      value={form.designation}
                      onChange={(event) =>
                        updateField(
                          "designation",
                          event.target.value
                        )
                      }
                      placeholder="Travel Consultant"
                    />

                    <TextInput
                      label="Department"
                      value={form.department}
                      onChange={(event) =>
                        updateField(
                          "department",
                          event.target.value
                        )
                      }
                      placeholder="Operations"
                    />

                    <TextInput
                      label="Experience years"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        form.experience_years
                      }
                      onChange={(event) =>
                        updateField(
                          "experience_years",
                          event.target.value
                        )
                      }
                      placeholder="5"
                    />
                  </div>
                </section>

                {/* Description */}

                <section>
                  <SectionHeading
                    title="Profile description"
                    description="Content used on team cards and profile pages."
                  />

                  <div className="space-y-4">
                    <TextArea
                      label="Short description"
                      value={
                        form.short_description
                      }
                      onChange={(event) =>
                        updateField(
                          "short_description",
                          event.target.value
                        )
                      }
                      placeholder="Short introduction shown on the team card."
                      rows={3}
                    />

                    <TextArea
                      label="Full description"
                      value={
                        form.full_description
                      }
                      onChange={(event) =>
                        updateField(
                          "full_description",
                          event.target.value
                        )
                      }
                      placeholder="Detailed employee biography and professional information."
                      rows={7}
                    />
                  </div>
                </section>

                {/* Image */}

                <section>
                  <ImageField
                    image={form.image}
                    onChange={(value) =>
                      updateField(
                        "image",
                        value
                      )
                    }
                  />
                </section>

                {/* Contact */}

                <section>
                  <SectionHeading
                    title="Contact information"
                    description="All contact fields are optional."
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <TextInput
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="employee@example.com"
                    />

                    <TextInput
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="+91..."
                    />

                    <TextInput
                      label="WhatsApp"
                      type="tel"
                      value={form.whatsapp}
                      onChange={(event) =>
                        updateField(
                          "whatsapp",
                          event.target.value
                        )
                      }
                      placeholder="+91..."
                    />
                  </div>
                </section>

                {/* Social */}

                <section>
                  <SectionHeading
                    title="Social profiles"
                    description="Optional professional and social links."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="LinkedIn"
                      type="url"
                      value={form.linkedin}
                      onChange={(event) =>
                        updateField(
                          "linkedin",
                          event.target.value
                        )
                      }
                      placeholder="https://linkedin.com/in/..."
                    />

                    <TextInput
                      label="Instagram"
                      type="url"
                      value={form.instagram}
                      onChange={(event) =>
                        updateField(
                          "instagram",
                          event.target.value
                        )
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </section>

                {/* Display */}

                <section>
                  <SectionHeading
                    title="Display settings"
                    description="Control team visibility and profile-page access."
                  />

                  <TextInput
                    label="Display order"
                    type="number"
                    min="0"
                    step="1"
                    value={form.display_order}
                    onChange={(event) =>
                      updateField(
                        "display_order",
                        event.target.value
                      )
                    }
                    placeholder="0"
                  />

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <VisibilityOption
                      checked={Boolean(
                        form.is_active
                      )}
                      onChange={(checked) =>
                        updateField(
                          "is_active",
                          checked
                        )
                      }
                      title="Active member"
                      description="When active, this employee can appear in the public Team section."
                    />

                    <VisibilityOption
                      checked={Boolean(
                        form.show_public_profile
                      )}
                      onChange={(checked) =>
                        updateField(
                          "show_public_profile",
                          checked
                        )
                      }
                      title="Show public profile"
                      description="Allows visitors to open the member's dedicated profile page."
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-semibold text-accent">
                      Visibility behavior
                    </p>

                    <div className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
                      <p>
                        <strong>
                          Active ON:
                        </strong>{" "}
                        appears in the public
                        Team section.
                      </p>

                      <p>
                        <strong>
                          Public profile ON:
                        </strong>{" "}
                        allows the dedicated
                        `/about/team/:slug` page.
                      </p>

                      <p>
                        <strong>
                          Both OFF:
                        </strong>{" "}
                        hidden from the public
                        site.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <Save size={17} />
                    ) : (
                      <Plus size={17} />
                    )}

                    {isEditing
                      ? "Update team member"
                      : "Create team member"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal helpers                                                              */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  title,
  description,
}) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-lg font-semibold text-navy">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-xs text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

function VisibilityOption({
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-slate-50 p-4 transition hover:bg-slate-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
      />

      <span>
        <span className="block text-sm font-semibold text-navy">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-muted">
          {description}
        </span>
      </span>
    </label>
  );
}




































