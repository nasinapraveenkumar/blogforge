
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../services/api";

export default function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        // Ask the backend to verify the current login session.
        await api.get("/auth/me");

        if (active) {
          setAuthenticated(true);
        }
      } catch (error) {
        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

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

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
