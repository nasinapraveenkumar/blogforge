import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./DashboardLayout.css";

const menuItems = [
  ["▦", "Dashboard", "/dashboard"],
  ["▤", "My Posts", "/my-posts"],
  ["↗", "Create Post", "/write"],
  ["⌕", "Explore", "/explore"],
  ["♧", "Bookmarks", "/bookmarks"],
  ["♧", "Community", "/community"],
  ["⚑", "My Reports", "/my-reports"],
  ["▱", "Messages", "/messages"],
  ["⚙", "Settings", "/settings"],
];

function formatName(value) {
  if (!value || typeof value !== "string") return "Writer";

  return value
    .trim()
    .split(/\s+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await api.get("/users/me");
        const result = response.data?.data;

        const profile =
          result?.user ||
          result?.data ||
          result ||
          response.data?.user ||
          null;

        if (!cancelled && profile && typeof profile === "object") {
          setUser(profile);
        }
      } catch (error) {
        console.warn("Unable to load header profile:", error);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await api.post("/auth/logout");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);

      window.alert(
        error.response?.data?.message ||
          "Unable to log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  const displayName = formatName(
    user?.name || user?.fullName || user?.username
  );

  const avatar =
    user?.profilePhoto ||
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePicture ||
    user?.image ||
    "";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-shell">
      <aside
        className={`dashboard-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <Link
          to="/dashboard"
          className="dashboard-brand"
          onClick={closeMenu}
        >
          <span className="dashboard-logo">◆</span>

          <span>
            BlogForge
            <small>Write. Share. Grow.</small>
          </span>
        </Link>

        <nav
          className="dashboard-nav"
          aria-label="Dashboard navigation"
        >
          {menuItems.map(([icon, label, path]) => (
            <NavLink
              key={label}
              to={path}
              end={path === "/dashboard"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `dashboard-nav-link ${isActive ? "selected" : ""}`
              }
            >
              <span className="nav-symbol">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-promo">
          <span className="promo-eyebrow">YOUR CREATOR SPACE</span>
          <h3>Write. Share. Grow.</h3>
          <p>
            Join a community of developers sharing knowledge.
          </p>

          <Link
            to="/write"
            className="promo-button"
            onClick={closeMenu}
          >
            Create a Post <span>↗</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <span className="online-dot" />
          Built for curious minds
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={
              mobileMenuOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <div className="dashboard-topbar-heading">
            <span>YOUR WORKSPACE</span>
            <strong>BlogForge</strong>
          </div>

          <div className="topbar-profile">
            <Link
              to="/settings"
              className="topbar-profile-link"
              aria-label="Open profile settings"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="profile-avatar"
                />
              ) : (
                <span className="profile-avatar">
                  {avatarLetter}
                </span>
              )}

              <span className="profile-copy">
                <strong title={displayName}>{displayName}</strong>
                <span>{user?.role || "Writer"}</span>
              </span>
            </Link>

            <button
              type="button"
              className="dashboard-logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Log out of BlogForge"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
