

import { useEffect, useState } from "react";
import {
  getAllMostVisitedAdmin,
  createMostVisited,
  updateMostVisited,
  deleteMostVisited,
} from "../../api/adminMostVisited";
import ImageUploadField from "../../components/admin/ImageUploadField";

const EMPTY_FORM = {
  place_name: "",
  description: "",
  best_time_to_visit: "",
  starting_from: "",
  display_order: 0,
  image: null,
  status: "published",
};

export default function MostVisitedManage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getAllMostVisitedAdmin()
      .then((data) => setItems(data.sort((a, b) => a.display_order - b.display_order)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      image: null,
    });
    setError("");
    setEditing({});
  };

  const openEdit = (m) => {
    setForm({
      place_name: m.place_name || "",
      description: m.description || "",
      best_time_to_visit: m.best_time_to_visit || "",
      starting_from:
        m.starting_from !== null && m.starting_from !== undefined ? m.starting_from : "",
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
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        display_order: Number(form.display_order),
        // Send null when the admin leaves Starting From empty
        starting_from: form.starting_from === "" ? null : Number(form.starting_from),
      };
      if (editing.id) {
        await updateMostVisited(editing.id, payload);
      } else {
        await createMostVisited(payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this destination?")) return;
    try {
      await deleteMostVisited(id);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not delete destination");
    }
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">Most Visited</h1>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-navy font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          + New Destination
        </button>
      </div>

      {/* Destination List */}
      {loading ? (
        <p className="text-navy/50 text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {items.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-navy/10 overflow-hidden min-w-0"
            >
              {/* Image */}
              <div className="h-40 sm:h-36 md:h-40 bg-surface">
                {m.image?.url && (
                  <img
                    src={m.image.url}
                    alt={m.place_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 min-w-0">
                <p className="font-semibold text-navy text-sm sm:text-base break-words">
                  {m.place_name}
                </p>
                <p className="text-xs text-navy/40 mt-0.5">Order: {m.display_order}</p>

                {/* Description */}
                {m.description && (
                  <p className="text-xs text-navy/60 mt-2 line-clamp-2 break-words">
                    {m.description}
                  </p>
                )}

                {/* Best Time */}
                {m.best_time_to_visit && (
                  <p className="text-xs text-navy/60 mt-2 break-words">
                    <span className="font-medium">Best time:</span> {m.best_time_to_visit}
                  </p>
                )}

                {/* Starting From */}
                {m.starting_from !== null && m.starting_from !== undefined && (
                  <p className="text-xs text-navy/60 mt-1 break-words">
                    <span className="font-medium">Starting from:</span> ₹
                    {Number(m.starting_from).toLocaleString("en-IN")}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    onClick={() => openEdit(m)}
                    className="w-full sm:w-auto text-secondary text-sm font-medium hover:underline text-left sm:text-center py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="w-full sm:w-auto text-red-600 text-sm font-medium hover:underline text-left sm:text-center py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-8 text-center">
              <p className="text-navy/40 text-sm">No destinations yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-navy-dark/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-ivory rounded-xl sm:rounded-2xl w-full max-w-md h-[96vh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-ivory px-4 sm:px-6 py-4 border-b border-navy/10">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-navy break-words">
                {editing.id ? "Edit Destination" : "New Destination"}
              </h2>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              {/* Place Name */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Place Name</label>
                <input
                  required
                  value={form.place_name}
                  onChange={(e) => setForm({ ...form, place_name: e.target.value })}
                  placeholder="e.g. Kasol"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description about the destination"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm resize-none"
                />
              </div>

              {/* Best Time */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Best Time to Visit
                </label>
                <input
                  type="text"
                  value={form.best_time_to_visit}
                  onChange={(e) => setForm({ ...form, best_time_to_visit: e.target.value })}
                  placeholder="e.g. March to June, September to November"
                  maxLength={255}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Starting From */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Starting From (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.starting_from}
                  onChange={(e) => setForm({ ...form, starting_from: e.target.value })}
                  placeholder="e.g. 12999"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-navy/15 text-sm min-w-0"
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

              {/* Error */}
              {error && <p className="text-sm text-red-600 break-words">{error}</p>}

              {/* Buttons */}
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
