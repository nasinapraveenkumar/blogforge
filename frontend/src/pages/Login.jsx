
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = form.email.trim();

    const emailPattern =
      /^[a-zA-Z0-9_+-]+(?:\.[a-zA-Z0-9_+-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/login", {
        email,
        password: form.password,
      });

      const meResponse = await api.get("/auth/me");

      // Support common API response formats.
      const payload = meResponse.data;
      const user =
        payload?.data?.user ||
        payload?.data ||
        payload?.user;

      if (!user) {
        throw new Error("Unable to retrieve the authenticated user.");
      }

      const role = String(user.role || "USER").toUpperCase();

      // ADMIN gets the Admin Dashboard.
      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      // MODERATOR gets the moderation workspace.
      if (role === "MODERATOR") {
        navigate("/moderation", { replace: true });
        return;
      }

      // Normal users get their dashboard.
      const requestedPath = location.state?.from?.pathname;

      const destination =
        requestedPath?.startsWith("/dashboard")
          ? requestedPath
          : "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 403) {
        setError(
          message || "You do not have permission to perform this action."
        );
      } else if (typeof message === "string") {
        setError(message);
      } else {
        setError(
          err.message ||
            "Unable to log in. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card glass-panel">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">B</span>
          <span>BlogForge</span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Log in to BlogForge</h1>
          <p>
            Continue writing, sharing, and growing with the community.
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
