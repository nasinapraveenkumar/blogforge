
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../services/api";

export default function RoleRoute({ allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await api.get("/auth/me");
        const payload = response.data;

        const currentUser =
          payload?.data?.user ||
          payload?.data ||
          payload?.user;

        if (active) {
          setUser(currentUser || null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <main className="auth-checking">
        <p>Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const role = String(user.role || "USER").toUpperCase();

  if (!allowedRoles.includes(role)) {
    const destination =
      role === "ADMIN"
        ? "/admin"
        : role === "MODERATOR"
          ? "/moderation"
          : "/dashboard";

    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
