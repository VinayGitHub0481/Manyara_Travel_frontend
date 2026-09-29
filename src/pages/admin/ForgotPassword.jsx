

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../api/passwordReset";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // -----------------------------------------
  // Common error handler
  // -----------------------------------------
  const getErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(", ");
    }

    return detail || fallback;
  };

  // -----------------------------------------
  // STEP 1: Send verification code
  // -----------------------------------------
  const handleSendCode = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await forgotPassword(email.trim());

      setMessage(
        "If an account exists for this email, a verification code has been sent."
      );

      setStep(2);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to send verification code. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // STEP 2: Verify OTP
  // -----------------------------------------
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await verifyResetCode(email.trim(), code);

      setResetToken(response.reset_token);

      setMessage(
        "Verification successful. You can now create a new password."
      );

      setStep(3);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Invalid or expired verification code."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // STEP 3: Reset password
  // -----------------------------------------
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(
        resetToken,
        newPassword,
        confirmPassword
      );

      setMessage("Your password has been reset successfully.");

      setStep(4);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to reset password. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------
  // Back to login
  // -----------------------------------------
  const handleBackToLogin = () => {
    navigate("/login");
  };

  // -----------------------------------------
  // Change email
  // -----------------------------------------
  const handleChangeEmail = () => {
    setStep(1);
    setCode("");
    setError("");
    setMessage("");
  };

  return (
    <div className="min-h-[100dvh] bg-navy flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">

      <div className="w-full max-w-sm sm:max-w-md">

        {/* -------------------------------- */}
        {/* BRAND */}
        {/* -------------------------------- */}
        <div className="text-center mb-6 sm:mb-8">

          <p className="font-display text-2xl sm:text-3xl font-semibold text-ivory">
            On a <span className="text-accent">Trip</span> Holiday
          </p>

          <p className="text-ivory/50 text-xs sm:text-sm mt-1">
            Password recovery
          </p>

        </div>

        {/* -------------------------------- */}
        {/* CARD */}
        {/* -------------------------------- */}
        <div className="w-full bg-ivory rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-xl">

          {/* ================================= */}
          {/* STEP 1 — EMAIL */}
          {/* ================================= */}
          {step === 1 && (
            <form
              onSubmit={handleSendCode}
              className="space-y-0"
            >

              {/* Icon */}
              <div className="flex justify-center mb-4 sm:mb-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-navy/5 flex items-center justify-center">
                  <Mail
                    className="text-navy"
                    size={22}
                  />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-lg sm:text-xl font-semibold text-navy text-center">
                Forgot your password?
              </h1>

              <p className="text-xs sm:text-sm leading-5 text-navy/60 text-center mt-2 mb-5 sm:mb-6">
                Enter your email address and we'll send you a
                verification code.
              </p>

              {/* Email */}
              <div className="mb-4">

                <label className="block text-xs sm:text-sm font-medium text-navy mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@onatripholiday.com"
                  className="
                    w-full
                    min-h-[44px]
                    px-3.5 sm:px-4
                    py-2.5
                    rounded-lg
                    border border-navy/15
                    bg-white
                    outline-none
                    focus:border-secondary
                    focus:ring-2
                    focus:ring-secondary/10
                    text-sm
                    text-navy
                    placeholder:text-navy/35
                    transition
                  "
                />

              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-red-600 leading-5">
                    {error}
                  </p>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-green-600 leading-5">
                    {message}
                  </p>
                </div>
              )}

              {/* Send Code */}
              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full
                  min-h-[44px]
                  px-4
                  py-2.5
                  rounded-lg
                  bg-navy
                  text-ivory
                  text-sm
                  font-semibold
                  hover:bg-navy-light
                  active:scale-[0.99]
                  transition
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {submitting
                  ? "Sending code…"
                  : "Send Verification Code"}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="
                  w-full
                  min-h-[44px]
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-3
                  text-xs sm:text-sm
                  text-navy/60
                  hover:text-navy
                  transition
                "
              >
                <ArrowLeft size={16} />
                Back to login
              </button>

            </form>
          )}

          {/* ================================= */}
          {/* STEP 2 — OTP */}
          {/* ================================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>

              {/* Icon */}
              <div className="flex justify-center mb-4 sm:mb-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-navy/5 flex items-center justify-center">
                  <ShieldCheck
                    className="text-navy"
                    size={22}
                  />
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-lg sm:text-xl font-semibold text-navy text-center">
                Verify your email
              </h1>

              <p className="text-xs sm:text-sm leading-5 text-navy/60 text-center mt-2 mb-5 sm:mb-6">

                Enter the 6-digit verification code sent to

                <span className="block mt-1 font-medium text-navy break-all">
                  {email}
                </span>

              </p>

              {/* OTP */}
              <div className="mb-4">

                <label className="block text-xs sm:text-sm font-medium text-navy mb-1.5">
                  Verification Code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="000000"
                  className="
                    w-full
                    min-h-[48px]
                    px-3
                    py-2.5
                    rounded-lg
                    border border-navy/15
                    bg-white
                    outline-none
                    focus:border-secondary
                    focus:ring-2
                    focus:ring-secondary/10
                    text-center
                    text-lg
                    sm:text-xl
                    tracking-[0.35em]
                    font-semibold
                    text-navy
                    placeholder:text-navy/25
                    transition
                  "
                />

              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-red-600 leading-5">
                    {error}
                  </p>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-green-600 leading-5">
                    {message}
                  </p>
                </div>
              )}

              {/* Verify */}
              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className="
                  w-full
                  min-h-[44px]
                  px-4
                  py-2.5
                  rounded-lg
                  bg-navy
                  text-ivory
                  text-sm
                  font-semibold
                  hover:bg-navy-light
                  active:scale-[0.99]
                  transition
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {submitting
                  ? "Verifying…"
                  : "Verify Code"}
              </button>

              {/* Change Email */}
              <button
                type="button"
                onClick={handleChangeEmail}
                className="
                  w-full
                  min-h-[44px]
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-3
                  text-xs sm:text-sm
                  text-navy/60
                  hover:text-navy
                  transition
                "
              >
                <ArrowLeft size={16} />
                Change email
              </button>

            </form>
          )}

          {/* ================================= */}
          {/* STEP 3 — NEW PASSWORD */}
          {/* ================================= */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>

              {/* Heading */}
              <h1 className="text-lg sm:text-xl font-semibold text-navy text-center">
                Create new password
              </h1>

              <p className="text-xs sm:text-sm leading-5 text-navy/60 text-center mt-2 mb-5 sm:mb-6">
                Choose a strong password for your account.
              </p>

              {/* New Password */}
              <div className="mb-4">

                <label className="block text-xs sm:text-sm font-medium text-navy mb-1.5">
                  New Password
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="
                      w-full
                      min-h-[44px]
                      px-3.5 sm:px-4
                      pr-11
                      py-2.5
                      rounded-lg
                      border border-navy/15
                      bg-white
                      outline-none
                      focus:border-secondary
                      focus:ring-2
                      focus:ring-secondary/10
                      text-sm
                      text-navy
                      transition
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="
                      absolute
                      right-2
                      sm:right-3
                      top-1/2
                      -translate-y-1/2
                      w-9
                      h-9
                      flex
                      items-center
                      justify-center
                      rounded-md
                      text-navy/50
                      hover:text-navy
                      hover:bg-navy/5
                      transition
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* Confirm Password */}
              <div className="mb-4">

                <label className="block text-xs sm:text-sm font-medium text-navy mb-1.5">
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="
                      w-full
                      min-h-[44px]
                      px-3.5 sm:px-4
                      pr-11
                      py-2.5
                      rounded-lg
                      border border-navy/15
                      bg-white
                      outline-none
                      focus:border-secondary
                      focus:ring-2
                      focus:ring-secondary/10
                      text-sm
                      text-navy
                      transition
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="
                      absolute
                      right-2
                      sm:right-3
                      top-1/2
                      -translate-y-1/2
                      w-9
                      h-9
                      flex
                      items-center
                      justify-center
                      rounded-md
                      text-navy/50
                      hover:text-navy
                      hover:bg-navy/5
                      transition
                    "
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* Password Hint */}
              <p className="text-[11px] sm:text-xs text-navy/45 mb-4">
                Password must contain at least 6 characters.
              </p>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                  <p className="text-xs sm:text-sm text-red-600 leading-5">
                    {error}
                  </p>
                </div>
              )}

              {/* Reset */}
              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full
                  min-h-[44px]
                  px-4
                  py-2.5
                  rounded-lg
                  bg-navy
                  text-ivory
                  text-sm
                  font-semibold
                  hover:bg-navy-light
                  active:scale-[0.99]
                  transition
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {submitting
                  ? "Resetting password…"
                  : "Reset Password"}
              </button>

            </form>
          )}

          {/* ================================= */}
          {/* STEP 4 — SUCCESS */}
          {/* ================================= */}
          {step === 4 && (
            <div className="text-center">

              {/* Success Icon */}
              <div className="flex justify-center mb-4 sm:mb-5">

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center">

                  <ShieldCheck
                    className="text-green-600"
                    size={28}
                  />

                </div>

              </div>

              {/* Heading */}
              <h1 className="text-lg sm:text-xl font-semibold text-navy">
                Password reset successful
              </h1>

              <p className="text-xs sm:text-sm leading-5 text-navy/60 mt-2 mb-5 sm:mb-6">
                Your password has been updated successfully.
                You can now sign in with your new password.
              </p>

              {/* Login */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="
                  w-full
                  min-h-[44px]
                  px-4
                  py-2.5
                  rounded-lg
                  bg-navy
                  text-ivory
                  text-sm
                  font-semibold
                  hover:bg-navy-light
                  active:scale-[0.99]
                  transition
                "
              >
                Back to Login
              </button>

            </div>
          )}

        </div>

        {/* Small footer spacing */}
        <p className="text-center text-[10px] sm:text-xs text-ivory/30 mt-5">
          © On a Trip Holiday
        </p>

      </div>
    </div>
  );
}