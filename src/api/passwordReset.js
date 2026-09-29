

import api from "./axios";

export const forgotPassword = (email) =>
  api
    .post("/auth/forgot-password", { email })
    .then((res) => res.data);

export const verifyResetCode = (email, code) =>
  api
    .post("/auth/verify-reset-code", { email, code })
    .then((res) => res.data);

export const resetPassword = (
  reset_token,
  new_password,
  confirm_password
) =>
  api
    .post("/auth/reset-password", {
      reset_token,
      new_password,
      confirm_password,
    })
    .then((res) => res.data);