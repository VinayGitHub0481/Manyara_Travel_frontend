

import api from "./axios";

// Submit enquiry from customer
export const createEnquiry = (payload) =>
  api.post("/enquiries", payload).then((res) => res.data);

// Get all enquiries for admin dashboard
export const getAllEnquiries = () =>
  api.get("/enquiries/admin").then((res) => res.data);

// Get single enquiry
export const getEnquiryById = (id) =>
  api.get(`/enquiries/admin/${id}`).then((res) => res.data);

// Delete enquiry
export const deleteEnquiry = (id) =>
  api.delete(`/enquiries/admin/${id}`);
