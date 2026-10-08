

import { useEffect, useState } from "react";
import {
  getAllSeasonedDestinations,
  createSeasonedDestination,
  updateSeasonedDestination,
  deleteSeasonedDestination,
  renumberSeasonedDestinations,
} from "../../api/adminSeasonedVisit";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY_FORM = {
  place_name: "",
  slug: "",
  description: "",
  season_label: "",
  season_start_date: "",
  season_end_date: "",
  best_time_to_visit: "",
  starting_from: "",
  display_order: 0,
  image: null,
  status: "published",
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const getErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return detail || fallback;
};

const fieldClass =
  "w-full min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-input text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-placeholder transition";

const labelClass = "block text-sm font-medium text-text-dark mb-1.5";
const hintClass = "text-xs text-muted mt-1";

export default function SeasonedManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [renumbering, setRenumbering] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getAllSeasonedDestinations()
      .then((data) =>
        setItems(data.sort((a, b) => a.display_order - b.display_order))
      )
      .catch((err) =>
        setError(getErrorMessage(err, "Could not load destinations"))
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const isEditingExisting = Boolean(editing?.id);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setEditing({});
  };

  const openEdit = (m) => {
    setForm({
      place_name: m.place_name || "",
      slug: m.slug || "",
      description: m.description || "",
      season_label: m.season_label || "",
      season_start_date: m.season_start_date || "",
      season_end_date: m.season_end_date || "",
      best_time_to_visit: m.best_time_to_visit || "",
      starting_from:
        m.starting_from !== null && m.starting_from !== undefined
          ? m.starting_from
          : "",
      display_order: m.display_order ?? 0,
      image: m.image || null,
      status: m.status || "published",
    });
    setError("");
    setEditing(m);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.image) {
      setError("Please upload an image — it's required for this entry.");
      return;
    }

    if (
      form.season_start_date &&
      form.season_end_date &&
      form.season_end_date < form.season_start_date
    ) {
      setError("Season end date can't be before the start date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Was the place renamed while editing?
      const nameChanged =
        isEditingExisting &&
        form.place_name.trim() !== (editing.place_name || "").trim();

      const payload = {
        ...form,
        // New entry or renamed place: build the slug from the name.
        // Unchanged name: keep the current slug (it may carry a suffix
        // like "-2" that the API added to keep it unique).
        slug:
          isEditingExisting && !nameChanged
            ? form.slug
            : slugify(form.place_name),
        display_order: Number(form.display_order) || 0,
        description: form.description || null,
        season_label: form.season_label || null,
        season_start_date: form.season_start_date || null,
        season_end_date: form.season_end_date || null,
        best_time_to_visit: form.best_time_to_visit || null,
        starting_from:
          form.starting_from === "" ? null : Number(form.starting_from),
      };

      if (isEditingExisting) {
        await updateSeasonedDestination(editing.id, payload);
      } else {
        await createSeasonedDestination(payload);
      }

      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save entry"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Delete this seasonal destination? Packages linked to it are kept and just unlinked."
      )
    )
      return;

    try {
      await deleteSeasonedDestination(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete destination"));
    }
  };

  const handleRenumber = async () => {
    setRenumbering(true);
    setError("");

    try {
      await renumberSeasonedDestinations();
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not renumber display order"));
    } finally {
      setRenumbering(false);
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-text-display">
          Seasonal Destinations
        </h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {items.length > 1 && (
            <button
              type="button"
              onClick={handleRenumber}
              disabled={renumbering}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-white text-sm font-medium text-text hover:border-primary hover:text-primary disabled:opacity-60 transition-colors"
            >
              {renumbering ? "Renumbering…" : "Fix order numbers"}
            </button>
          )}

          <button
            onClick={openCreate}
            className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-brand transition-colors"
          >
            + New Destination
          </button>
        </div>
      </div>

      {error && !editing && (
        <p role="alert" className="text-sm text-error-text mb-4 break-words">
          {error}
        </p>
      )}

      {/* Destination List */}
      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {items.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-xl border border-divider shadow-travel-card overflow-hidden min-w-0"
            >
              {/* Image */}
              <div className="relative h-40 sm:h-36 md:h-40 bg-surface">
                {m.image?.url && (
                  <img
                    src={m.image.url}
                    alt={m.place_name}
                    className="w-full h-full object-cover"
                  />
                )}

                {m.season_label && (
                  <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-travel-card">
                    {m.season_label}
                  </span>
                )}

                {m.status === "draft" && (
                  <span className="absolute right-2 top-2 rounded-full bg-warning-bg px-2.5 py-1 text-[11px] font-semibold text-warning-text">
                    Draft
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 min-w-0">
                <p className="font-semibold text-text-dark text-sm sm:text-base break-words">
                  {m.place_name}
                </p>

                <p className="text-xs text-muted mt-0.5 break-all">
                  /{m.slug}
                </p>

                <p className="text-xs text-muted mt-0.5">
                  Order: {m.display_order}
                </p>

                {m.description && (
                  <p className="text-xs text-text mt-2 line-clamp-2 break-words">
                    {m.description}
                  </p>
                )}

                {(m.season_start_date || m.season_end_date) && (
                  <p className="text-xs text-text mt-2 break-words">
                    <span className="font-medium">Season:</span>{" "}
                    {formatDate(m.season_start_date) || "—"} to{" "}
                    {formatDate(m.season_end_date) || "—"}
                  </p>
                )}

                {m.best_time_to_visit && (
                  <p className="text-xs text-text mt-1 break-words">
                    <span className="font-medium">Best time:</span>{" "}
                    {m.best_time_to_visit}
                  </p>
                )}

                {m.starting_from !== null && m.starting_from !== undefined && (
                  <p className="text-xs text-text mt-1 break-words">
                    <span className="font-medium">Starting from:</span> ₹
                    {Number(m.starting_from).toLocaleString("en-IN")}
                  </p>
                )}

                <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    onClick={() => openEdit(m)}
                    className="w-full sm:w-auto text-link hover:text-link-hover text-sm font-medium hover:underline text-left sm:text-center py-1"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="w-full sm:w-auto text-error-text text-sm font-medium hover:underline text-left sm:text-center py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-8 text-center">
              <p className="text-muted text-sm">
                No seasonal destinations yet. Add your first one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-2 sm:p-4 z-[70]">
          <div className="bg-card rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-travel-hover">
            <div className="sticky top-0 z-10 bg-card px-4 sm:px-6 py-4 border-b border-divider">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-text-display break-words">
                {isEditingExisting
                  ? "Edit Seasonal Destination"
                  : "New Seasonal Destination"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              {/* Place Name */}
              <div>
                <label className={labelClass}>Place Name</label>
                <input
                  required
                  maxLength={150}
                  value={form.place_name}
                  onChange={(e) =>
                    setForm({ ...form, place_name: e.target.value })
                  }
                  placeholder="e.g. Munnar"
                  className={fieldClass}
                />
                <p className={hintClass}>
                  The page URL is created from the place name
                  {isEditingExisting && " and updates if you rename it"}.
                </p>
              </div>

              {/* Season Label */}
              <div>
                <label className={labelClass}>Season Label</label>
                <input
                  maxLength={150}
                  value={form.season_label}
                  onChange={(e) =>
                    setForm({ ...form, season_label: e.target.value })
                  }
                  placeholder="e.g. Monsoon Magic"
                  className={fieldClass}
                />
                <p className={hintClass}>
                  Destinations with the same label are grouped together on the
                  public page.
                </p>
              </div>

              {/* Season dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Season Starts</label>
                  <input
                    type="date"
                    value={form.season_start_date}
                    onChange={(e) =>
                      setForm({ ...form, season_start_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Season Ends</label>
                  <input
                    type="date"
                    min={form.season_start_date || undefined}
                    value={form.season_end_date}
                    onChange={(e) =>
                      setForm({ ...form, season_end_date: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Why is this place great in this season?"
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Best Time */}
              <div>
                <label className={labelClass}>Best Time to Visit</label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.best_time_to_visit}
                  onChange={(e) =>
                    setForm({ ...form, best_time_to_visit: e.target.value })
                  }
                  placeholder="e.g. June to September"
                  className={fieldClass}
                />
              </div>

              {/* Starting From */}
              <div>
                <label className={labelClass}>Starting From (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.starting_from}
                  onChange={(e) =>
                    setForm({ ...form, starting_from: e.target.value })
                  }
                  placeholder="e.g. 12999"
                  className={fieldClass}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({ ...form, display_order: e.target.value })
                  }
                  className={fieldClass}
                />
                <p className={hintClass}>
                  Position in the list (1 = first). Leave 0 to add it last.
                  Other destinations shift automatically.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className={fieldClass}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Image */}
              <ImageUploadField
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
                label="Destination Image"
              />

              {error && (
                <p role="alert" className="text-sm text-error-text break-words">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-medium text-text hover:bg-surface-strong"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-white shadow-brand hover:bg-accent-hover disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}






























