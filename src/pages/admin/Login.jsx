
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/admin/dashboard/packages");
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-navy flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="font-display text-2xl sm:text-3xl font-semibold text-ivory">
            On a <span className="text-accent">Trip</span> Holiday
          </p>

          <p className="text-ivory/50 text-xs sm:text-sm mt-1">
            Admin &amp; creator sign in
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="
            w-full
            bg-ivory
            rounded-xl sm:rounded-2xl
            p-5 sm:p-7
            shadow-xl
            space-y-4
          "
        >
          {/* Email */}
          <div>
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
                focus:ring-2 focus:ring-secondary/10
                text-sm
                text-navy
                placeholder:text-navy/35
                transition
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-navy mb-1.5">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  w-full
                  min-h-[44px]
                  px-3.5 sm:px-4
                  pr-12
                  py-2.5
                  rounded-lg
                  border border-navy/15
                  bg-white
                  outline-none
                  focus:border-secondary
                  focus:ring-2 focus:ring-secondary/10
                  text-sm
                  text-navy
                  placeholder:text-navy/35
                  transition
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="
                  absolute
                  right-2 sm:right-3
                  top-1/2
                  -translate-y-1/2
                  w-9 h-9
                  flex items-center justify-center
                  rounded-md
                  text-navy/50
                  hover:text-navy
                  hover:bg-navy/5
                  transition
                "
                aria-label={
                  showPassword ? "Hide password" : "Show password"
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

          {/* Forgot Password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="
                min-h-[36px]
                px-1
                text-xs sm:text-sm
                text-secondary
                hover:text-accent
                font-medium
                transition-colors
              "
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
              <p className="text-xs sm:text-sm text-red-600 leading-5">
                {error}
              </p>
            </div>
          )}

          {/* Sign In */}
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
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs text-ivory/30 mt-5">
          © On a Trip Holiday
        </p>
      </div>
    </div>
  );
}
