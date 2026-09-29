import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// requireAdmin: pass true for admin-only pages (e.g. Manage Creators)
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy/50">Loading…</div>;
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/admin/dashboard" replace />;

  return children;
}
