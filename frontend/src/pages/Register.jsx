
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();

    // Validate the name.
    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    // Validate the email format before calling the backend.
    const emailPattern =
      /^[a-zA-Z0-9_+-]+(?:\.[a-zA-Z0-9_+-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate the password.
    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password: form.password,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      const responseData = err.response?.data;
      const serverMessage = responseData?.message;
      const validationErrors = Array.isArray(serverMessage)
        ? serverMessage
        : Array.isArray(responseData?.errors)
          ? responseData.errors
          : [];

      // Convert backend validation details into readable messages.
      const emailError = validationErrors.some((item) =>
        item.path?.includes("email")
      );

      const passwordError = validationErrors.some((item) =>
        item.path?.includes("password")
      );

      const nameError = validationErrors.some((item) =>
        item.path?.includes("name")
      );

      if (
        emailError ||
        (typeof serverMessage === "string" &&
          /invalid email|valid email|email format|invalid_format/i.test(
            serverMessage
          ))
      ) {
        setError("Please enter a valid email address.");
      } else if (passwordError) {
        setError("Please enter a valid password.");
      } else if (nameError) {
        setError("Please enter a valid name.");
      } else if (
        typeof serverMessage === "string" &&
        /already exists|already registered|duplicate/i.test(serverMessage)
      ) {
        setError(
          "This email is already registered. Please log in or use another email."
        );
      } else if (
        err.response?.status === 409
      ) {
        setError(
          "This email is already registered. Please log in or use another email."
        );
      } else if (typeof serverMessage === "string") {
        setError(serverMessage);
      } else {
        setError(
          "Registration failed. Please check your details and try again."
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
          <span className="auth-eyebrow">JOIN THE COMMUNITY</span>
          <h1>Create your account.</h1>
          <p>
            Make room for your ideas. The internet has enough cat videos.
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              minLength={2}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />
            <span className="auth-hint">
              Use at least 8 characters.
            </span>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create my account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
      </section>
    </main>
  );
}

export default Register;
