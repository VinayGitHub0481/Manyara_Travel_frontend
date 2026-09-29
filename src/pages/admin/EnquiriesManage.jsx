



import { useEffect, useState } from "react";
import {
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Package as PackageIcon,
} from "lucide-react";

import {
  getAllEnquiries,
  deleteEnquiry,
} from "../../api/enquiries";


// ============================================================
// PACKAGE TYPE LABELS
// ============================================================
const PACKAGE_TYPE_LABELS = {
  pilgrimage: "Pilgrimage",
  mountains_adventure: "Mountains & Adventure",
  family: "Family",
  beach: "Beach",
  romantic: "Romantic Sites",
  wildlife_nature: "Wildlife & Nature",
  international: "International",
};

const getPackageTypeLabel = (value) => {
  if (!value) {
    return "-";
  }

  return (
    PACKAGE_TYPE_LABELS[value] ||
    String(value)
      .replace(/_/g, " ")
      .replace(/\\b\\w/g, (letter) => letter.toUpperCase())
  );
};

export default function EnquiriesManage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllEnquiries();

      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Failed to load enquiries. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this enquiry?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteEnquiry(id);

      setEnquiries((prev) =>
        prev.filter((enquiry) => enquiry.id !== id)
      );

      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(null);
      }
    } catch (err) {
      console.error("Failed to delete enquiry:", err);

      const detail = err?.response?.data?.detail;

      alert(
        typeof detail === "string"
          ? detail
          : "Failed to delete enquiry. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTravelDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">
            Enquiries
          </h1>

          <p className="mt-1 text-sm sm:text-base text-gray-500">
            View customer enquiries submitted through the website.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEnquiries}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy text-white hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}

          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 size={32} className="animate-spin mb-3" />
          <p>Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-gray-200 bg-white p-8 sm:p-12 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-navy">
            No enquiries yet
          </h2>

          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Customer enquiries will appear here once they are submitted.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Package
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Package Type
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Contact
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Travellers
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Travel Date
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Batch
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-navy">
                    Submitted
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold text-navy">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr
                    key={enquiry.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
                  >
                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {enquiry.name}
                      </p>


                    </td>

                    {/* Package */}
            <td className="px-4 py-4">
              {enquiry.package_id ? (
                <div className="flex items-center gap-2">
                  <PackageIcon
                    size={16}
                    className="text-navy shrink-0"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {enquiry.package_title || "Package"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Package #{enquiry.package_id}
                    </p>

                    {enquiry.batch_id != null && (
                      <p className="text-xs text-gray-500">
                        Batch #{enquiry.batch_id}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">
                  No package
                </span>
              )}
            </td>

                    {/* Package Type */}
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[#061B45]/5 px-2.5 py-1 text-xs font-medium text-navy">
                        {getPackageTypeLabel(enquiry.package_type)}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {enquiry.phone}
                    </td>

                    {/* Travellers */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {enquiry.travellers}
                    </td>

                    {/* Travel Date */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatTravelDate(enquiry.travel_date)}
                    </td>

                    {/* Batch */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {enquiry.batch_id != null
                        ? `Batch #${enquiry.batch_id}`
                        : "-"}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(enquiry.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEnquiry(enquiry)
                          }
                          className="px-3 py-2 rounded-lg bg-gray-100 text-navy text-sm font-medium hover:bg-gray-200 transition"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(enquiry.id)
                          }
                          disabled={deletingId === enquiry.id}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-60"
                        >
                          {deletingId === enquiry.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}

                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Customer */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg text-navy break-words">
                      {enquiry.name}
                    </h2>


                  </div>

                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    #{enquiry.id}
                  </span>
                </div>

                {/* Package / Package Type / Batch */}
                <div className="mt-4 rounded-lg bg-gray-50 p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <PackageIcon
                      size={17}
                      className="text-navy shrink-0 mt-0.5"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500">
                        Package
                      </p>

                      <p className="text-sm font-medium text-gray-800">
                        {enquiry.package_title || "No Package"}
                      </p>

                      {enquiry.package_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Package #{enquiry.package_id}
                        </p>
                      )}

                      {enquiry.batch_id != null && (
                        <p className="text-xs text-gray-500">
                          Batch #{enquiry.batch_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Package Type
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {getPackageTypeLabel(enquiry.package_type)}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Phone
                    </span>

                    <span className="text-gray-800 break-all text-right">
                      {enquiry.phone}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Travellers
                    </span>

                    <span className="text-gray-800">
                      {enquiry.travellers}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Travel Date
                    </span>

                    <span className="text-gray-800">
                      {formatTravelDate(
                        enquiry.travel_date
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Batch
                    </span>

                    <span className="text-gray-800">
                      {enquiry.batch_id != null
                        ? `#${enquiry.batch_id}`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500">
                      Submitted
                    </span>

                    <span className="text-gray-800">
                      {formatDate(enquiry.created_at)}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {enquiry.message && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Message
                    </p>

                    <p className="text-sm text-gray-700 break-words">
                      {enquiry.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEnquiry(enquiry)
                    }
                    className="w-full sm:w-auto flex-1 px-3 py-2.5 rounded-lg bg-gray-100 text-navy text-sm font-medium hover:bg-gray-200 transition"
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(enquiry.id)
                    }
                    disabled={deletingId === enquiry.id}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-60"
                  >
                    {deletingId === enquiry.id ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-2xl max-h-[96vh] sm:max-h-[92vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-navy">
                  Enquiry Details
                </h2>

                <p className="text-sm text-gray-500">
                  Enquiry #{selectedEnquiry.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(null)
                }
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Enquiry Type */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Enquiry Type
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <PackageIcon
                    size={18}
                    className="text-navy"
                  />

                  <p className="text-base font-medium text-gray-900">
                    {selectedEnquiry.package_id
                      ? `Package Enquiry #${selectedEnquiry.package_id}`
                      : "General Enquiry"}
                  </p>
                </div>
              </div>

              {/* Package / Batch / Package Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Package
                  </p>

                  <p className="mt-1 text-base font-medium text-gray-900">
                    {selectedEnquiry.package_title || "No Package"}
                  </p>

                  {selectedEnquiry.package_id && (
                    <p className="mt-1 text-sm text-gray-500">
                      Package #{selectedEnquiry.package_id}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Batch ID
                  </p>

                  <p className="mt-1 text-base text-gray-800">
                    {selectedEnquiry.batch_id ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Package Type
                  </p>

                  <p className="mt-1 text-base text-gray-800">
                    {getPackageTypeLabel(
                      selectedEnquiry.package_type
                    )}
                  </p>
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Customer Name
                </p>

                <p className="mt-1 text-base font-medium text-gray-900">
                  {selectedEnquiry.name}
                </p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Phone
                </p>

                <p className="mt-1 text-base text-gray-800 break-all">
                  {selectedEnquiry.phone}
                </p>
              </div>

              {/* Travellers + Travel Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Number of Travellers
                  </p>

                  <p className="mt-1 text-base text-gray-800">
                    {selectedEnquiry.travellers}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Travel Date
                  </p>

                  <p className="mt-1 text-base text-gray-800">
                    {formatTravelDate(
                      selectedEnquiry.travel_date
                    )}
                  </p>
                </div>
              </div>

              {/* Submitted */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Submitted Date & Time
                </p>

                <p className="mt-1 text-base text-gray-800">
                  {formatDate(
                    selectedEnquiry.created_at
                  )}
                </p>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Requirements
                </p>

                <div className="mt-2 rounded-lg bg-gray-50 p-4">
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                    {selectedEnquiry.message ||
                      "No message provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={() =>
                  setSelectedEnquiry(null)
                }
                className="w-full sm:w-auto sm:ml-auto block px-5 py-2.5 rounded-lg bg-navy text-white hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


