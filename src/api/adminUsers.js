import api from "./axios";

// admin-only: manage content creators
export const listCreators = () => api.get("/admin/creators").then((res) => res.data);

export const registerUser = (payload) =>
  api.post("/auth/register", payload).then((res) => res.data);

export const setCreatorStatus = (userId, isActive) =>
  api
    .patch(`/admin/creators/${userId}/status`, { is_active: isActive })
    .then((res) => res.data);

export const deleteCreator = (userId) => api.delete(`/admin/creators/${userId}`);

// image upload -> returns { url, public_id }
export const uploadImage = (
  file,
  { onProgress, signal, endpoint = "/uploads/image" } = {}
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api
    .post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    })
    .then((res) => res.data);
};


// vidoe upload
export const uploadVideo = (file, { onProgress, signal } = {}) => {
  const formData = new FormData();
  formData.append("file", file);

  return api
    .post("/uploads/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      timeout: 0,
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      },
    })
    .then((res) => res.data);
};