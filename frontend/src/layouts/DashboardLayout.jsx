
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

function formatName(name) {
  if (!name) return "Writer";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "BF"
  );
}

export default function DashboardLayout() {
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

  return (
    <div className="dashboard-shell">
      <aside
        className={`dashboard-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        <button
          className="mobile-sidebar-close"
          type="button"
          onClick={closeMenu}
          aria-label="Close navigation"
        >
          ×
        </button>

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

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
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
          onClick={closeMenu}
          aria-label="Close navigation menu"
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="dashboard-topbar-title">
            <span>YOUR WORKSPACE</span>
            <strong>BlogForge</strong>
          </div>

          <div className="dashboard-topbar-actions">
            <Link
              to="/settings"
              className="dashboard-profile-link"
              aria-label="Open profile settings"
              title="Profile settings"
            >
              <span className="dashboard-profile-avatar">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

                {!avatar && (
                  <span>{getInitials(displayName)}</span>
                )}

                {avatar && (
                  <span className="dashboard-profile-fallback">
                    {getInitials(displayName)}
                  </span>
                )}
              </span>

              <span className="dashboard-profile-details">
                <strong>{displayName}</strong>
                <small>{formatName(user?.role || "Writer")}</small>
              </span>
            </Link>

            <button
              type="button"
              className="dashboard-logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
