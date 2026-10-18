
import { useEffect, useState } from "react";
import api from "../services/api";
import "./ProfileSettings.css";

function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await api.get("/users/me");
        const result = response.data?.data;
        const profile = result?.user || result?.data || result;

        if (!profile || typeof profile !== "object") {
          throw new Error("Invalid profile response.");
        }

        if (!cancelled) {
          setUser(profile);
          setName(profile.name || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (name.trim().length < 2 || name.trim().length > 50) {
      setError("Your name must be between 2 and 50 characters.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await api.patch("/users/me", {
        name: name.trim(),
      });

      const updatedUser = response.data?.data;

      if (updatedUser) {
        setUser(updatedUser);
        setName(updatedUser.name || name.trim());
      }

      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      const response = await api.patch("/users/change-password", {
        currentPassword,
        newPassword,
      });

      setMessage(
        response.data?.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="bf-profile-page">
        <p>Loading your profile...</p>
      </main>
    );
  }

  const displayName = user?.name || "BlogForge Member";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const photo =
    user?.profilePhoto ||
    user?.avatar ||
    user?.avatarUrl ||
    "";

  return (
    <main className="bf-profile-page">
      <header className="bf-profile-heading">
        <p className="bf-profile-eyebrow">YOUR WORKSPACE</p>
        <h1>Profile &amp; Settings</h1>
        <p>Manage your personal information and account security.</p>
      </header>

      {(message || error) && (
        <div
          className={`bf-profile-notice ${
            error ? "bf-profile-notice-error" : "bf-profile-notice-success"
          }`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <section className="bf-profile-card bf-profile-identity">
        <div className="bf-profile-avatar">
          {photo ? (
            <img src={photo} alt={`${displayName}'s profile`} />
          ) : (
            <span>{initials || "BF"}</span>
          )}
        </div>

        <div className="bf-profile-identity-info">
          <h2>{displayName}</h2>
          <p>{user?.email || "Email unavailable"}</p>
          <span className="bf-profile-role">
            {user?.role || "USER"}
          </span>
        </div>
      </section>

      <section className="bf-profile-section">
        <div className="bf-profile-section-heading">
          <div>
            <h2>Personal information</h2>
            <p>Update the name displayed on your account.</p>
          </div>
        </div>

        <form
          className="bf-profile-card bf-profile-form"
          onSubmit={handleProfileSave}
        >
          <label className="bf-profile-input-group">
            <span>Display name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={50}
              autoComplete="name"
              required
            />
          </label>

          <label className="bf-profile-input-group">
            <span>Email address</span>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              readOnly
            />
            <small>Email editing is not enabled.</small>
          </label>

          <div className="bf-profile-form-actions">
            <button
              type="submit"
              className="bf-profile-button"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="bf-profile-section">
        <div className="bf-profile-section-heading">
          <div>
            <h2>Change password</h2>
            <p>Verify your current password before choosing a new one.</p>
          </div>
        </div>

        <form
          className="bf-profile-card bf-profile-form"
          onSubmit={handlePasswordChange}
        >
          <label className="bf-profile-input-group">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label className="bf-profile-input-group">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
            <small>Use at least 8 characters.</small>
          </label>

          <label className="bf-profile-input-group">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>

          <div className="bf-profile-form-actions">
            <button
              type="submit"
              className="bf-profile-button"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <section className="bf-profile-section">
        <div className="bf-profile-section-heading">
          <div>
            <h2>Profile photo</h2>
            <p>Personalize your dashboard with your own photo.</p>
          </div>
        </div>

        <div className="bf-profile-card bf-profile-photo-pending">
          <p>
            Photo upload is not connected yet. We'll enable it after
            configuring persistent image storage.
          </p>
        </div>
      </section>
    </main>
  );
}

export default ProfileSettings;
