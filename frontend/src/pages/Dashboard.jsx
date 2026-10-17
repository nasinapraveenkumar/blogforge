
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

const menuItems = [
  ["▦", "Dashboard", "/dashboard"],
  ["▤", "My Posts", "/my-posts"],
  ["↗", "Create Post", "/write"],
  ["⌕", "Explore", "/"],
  ["♧", "Bookmarks", "/bookmarks"],
  ["◇", "Moderation", "/moderation"],
  ["▥", "Analytics", "/dashboard"],
  ["♧", "Community", "/"],
  ["▱", "Messages", "/"],
  ["⚙", "Settings", "/settings"],
];

const formatStatus = (status = "UNKNOWN") =>
  status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    pending: 0,
    drafts: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the current user's posts and profile.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/posts/mine");
        const result = response.data?.data;

        if (!result || !Array.isArray(result.posts)) {
          throw new Error("Unexpected response from the posts API.");
        }

        let profile = null;

        try {
          const profileResponse = await api.get("/users/me");
          const profileResult = profileResponse.data?.data;

          profile =
            profileResult?.user ||
            profileResult?.data ||
            profileResult ||
            null;
        } catch (profileError) {
          console.warn(
            "Profile could not be loaded:",
            profileError
          );
        }

        if (cancelled) return;

        setPosts(result.posts);
        setUser(profile);

        setStats({
          totalPosts: result.stats?.totalPosts ?? result.posts.length,
          published: result.stats?.published ?? 0,
          pending: result.stats?.pending ?? 0,
          drafts: result.stats?.drafts ?? 0,
          rejected: result.stats?.rejected ?? 0,
        });
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
          }

          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Close the mobile drawer when Escape is pressed.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  // Prevent background scrolling while the mobile drawer is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  // Log out and clear the authentication cookie.
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await api.post("/auth/logout");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to log out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const visiblePosts = posts.filter((post) =>
    (post.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "Writer";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const statCards = [
    {
      icon: "▤",
      label: "Total Posts",
      value: stats.totalPosts,
      color: "mint",
    },
    {
      icon: "◉",
      label: "Published Posts",
      value: stats.published,
      color: "blue",
    },
    {
      icon: "◷",
      label: "Pending Review",
      value: stats.pending,
      color: "purple",
    },
    {
      icon: "✎",
      label: "Drafts",
      value: stats.drafts,
      color: "pink",
    },
  ];

  const statusItems = [
    { label: "Published", count: stats.published, color: "#10b981" },
    { label: "Pending", count: stats.pending, color: "#f59e0b" },
    { label: "Drafts", count: stats.drafts, color: "#64748b" },
    { label: "Rejected", count: stats.rejected, color: "#ef4444" },
  ];

  const statusTotal = statusItems.reduce(
    (total, item) => total + item.count,
    0
  );

  let angle = 0;

  const donutSegments = statusItems.map((item) => {
    const start = angle;
    angle += statusTotal ? (item.count / statusTotal) * 360 : 0;

    return `${item.color} ${start}deg ${angle}deg`;
  });

  const donutGradient = statusTotal
    ? `conic-gradient(${donutSegments.join(", ")})`
    : "conic-gradient(#e8efed 0deg 360deg)";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="dashboard-shell">
      <aside
        id="dashboard-mobile-sidebar"
        className={`dashboard-sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
        aria-label="Dashboard sidebar"
        aria-hidden={
          typeof window !== "undefined" &&
          window.innerWidth <= 760 &&
          !mobileMenuOpen
        }
      >
        <button
          type="button"
          className="mobile-sidebar-close"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        >
          ✕
        </button>

        <Link
          to="/"
          className="dashboard-brand"
          onClick={closeMobileMenu}
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
            <Link
              key={label}
              to={path}
              onClick={() => {
                setActiveMenu(label);
                closeMobileMenu();
              }}
              className={`dashboard-nav-link ${
                activeMenu === label ? "selected" : ""
              }`}
            >
              <span className="nav-symbol">{icon}</span>
              <span>{label}</span>
            </Link>
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
            onClick={closeMobileMenu}
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
          onClick={closeMobileMenu}
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open navigation menu"
            aria-controls="dashboard-mobile-sidebar"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <label className="dashboard-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search your posts..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search dashboard posts"
            />
            <kbd>Search</kbd>
          </label>

          <div className="topbar-profile">
            <div className="profile-avatar">{avatarLetter}</div>

            <div className="profile-copy">
              <strong>{displayName}</strong>
              <span>{user?.role || "Writer"}</span>
            </div>

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
          <section className="welcome-panel">
            <div className="welcome-copy">
              <span className="welcome-eyebrow">
                YOUR CREATOR DASHBOARD
              </span>

              <h1>Welcome back,</h1>
              <h2>
                {displayName} <span>✦</span>
              </h2>

              <p>
                Keep sharing your ideas and inspire fellow developers.
              </p>

              <div className="welcome-actions">
                <Link to="/write" className="primary-action">
                  <span>＋</span> Write a New Post <span>→</span>
                </Link>

                <Link to="/my-posts" className="secondary-action">
                  View My Posts
                </Link>
              </div>
            </div>

            <div className="quote-card">
              <span className="quote-mark">“</span>
              <p>
                A platform where developers turn ideas into impact.
              </p>
              <span className="quote-author">— BlogForge</span>
            </div>

            <div className="welcome-decoration decoration-one" />
            <div className="welcome-decoration decoration-two" />
          </section>

          {error && (
            <div
              role="alert"
              style={{
                padding: "14px 18px",
                marginBottom: "20px",
                borderRadius: "12px",
                background: "#fff1f2",
                color: "#be123c",
                border: "1px solid #fecdd3",
              }}
            >
              <strong>
                {loggingOut
                  ? "Unable to log out"
                  : "Unable to load dashboard"}
              </strong>

              <p style={{ margin: "6px 0 0" }}>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  marginTop: "10px",
                  padding: "8px 14px",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                  background: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

          <section
            className="stats-grid"
            aria-label="Blog statistics"
          >
            {statCards.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-icon ${stat.color}`}>
                  {stat.icon}
                </div>

                <div className="stat-details">
                  <strong>{loading ? "—" : stat.value}</strong>
                  <span>{stat.label}</span>
                  <small>
                    {loading ? "Loading..." : "Your current total"}
                  </small>
                </div>
              </article>
            ))}
          </section>

          <div className="dashboard-columns">
            <div className="dashboard-primary-column">
              <section className="panel views-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">
                      CONTENT INSIGHTS
                    </span>
                    <h3>
                      <span className="heading-icon">▥</span>
                      Publishing Overview
                    </h3>
                  </div>
                </div>

                <div className="chart-summary">
                  <strong>
                    {loading ? "—" : stats.totalPosts}
                    <span> posts</span>
                  </strong>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "14px",
                    padding: "22px 0",
                  }}
                >
                  {statusItems.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "16px",
                        border: "1px solid #e5eeeb",
                        borderRadius: "12px",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: item.color,
                          marginBottom: "12px",
                        }}
                      />

                      <strong
                        style={{
                          display: "block",
                          fontSize: "23px",
                          color: "#1e293b",
                        }}
                      >
                        {loading ? "—" : item.count}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="demo-note">
                  Counts are based on your actual posts and their
                  current statuses.
                </p>
              </section>

              <section className="panel recent-posts-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">
                      CONTENT MANAGEMENT
                    </span>
                    <h3>
                      <span className="heading-icon">▤</span>
                      Recent Posts
                    </h3>
                  </div>

                  <Link to="/my-posts" className="view-all-link">
                    View all →
                  </Link>
                </div>

                <div className="posts-table-wrap">
                  <table className="posts-table">
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>Likes</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan="5" className="table-empty">
                            Loading your posts...
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        !error &&
                        visiblePosts.map((post) => (
                          <tr key={post._id}>
                            <td>
                              <div className="table-article">
                                <span className="article-thumbnail">
                                  {(post.title || "BP")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                                <span>{post.title}</span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`post-status status-${(
                                  post.status || "unknown"
                                ).toLowerCase()}`}
                              >
                                <span />
                                {formatStatus(post.status)}
                              </span>
                            </td>

                            <td>—</td>
                            <td>—</td>
                            <td>{formatDate(post.createdAt)}</td>
                          </tr>
                        ))}

                      {!loading &&
                        !error &&
                        visiblePosts.length === 0 && (
                          <tr>
                            <td colSpan="5" className="table-empty">
                              {posts.length === 0
                                ? "You haven't created any posts yet."
                                : "No matching posts found."}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>

                <p className="demo-note">
                  Views and likes will appear when those metrics are
                  available from the backend.
                </p>
              </section>
            </div>

            <aside className="dashboard-secondary-column">
              <section className="panel quick-actions-panel">
                <div className="panel-heading">
                  <h3>
                    <span className="heading-icon">✳</span>
                    Quick Actions
                  </h3>
                </div>

                <Link
                  to="/write"
                  className="quick-action featured-action"
                >
                  <span>↗</span> Write a New Post <b>›</b>
                </Link>

                <Link to="/my-posts" className="quick-action">
                  <span>▤</span> View My Posts <b>›</b>
                </Link>

                <Link to="/settings" className="quick-action">
                  <span>♙</span> Edit Profile <b>›</b>
                </Link>

                <Link to="/settings" className="quick-action">
                  <span>⚙</span> Account Settings <b>›</b>
                </Link>

                <button
                  type="button"
                  className="quick-action dashboard-logout-secondary"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <span>↪</span>
                  {loggingOut ? "Logging out..." : "Log out"}
                  <b>›</b>
                </button>
              </section>

              <section className="panel status-panel">
                <div className="panel-heading">
                  <h3>
                    <span className="heading-icon">▣</span>
                    Post Status
                  </h3>
                </div>

                <div className="status-content">
                  <div
                    className="status-donut"
                    style={{
                      background: loading
                        ? "#e8efed"
                        : donutGradient,
                    }}
                  >
                    <div>
                      <strong>
                        {loading ? "—" : statusTotal}
                      </strong>
                      <span>Posts</span>
                    </div>
                  </div>

                  <div className="status-legend">
                    {statusItems.map((item) => (
                      <span key={item.label}>
                        <i style={{ background: item.color }} />
                        {item.label}
                        <b>{loading ? "—" : item.count}</b>
                      </span>
                    ))}
                  </div>
                </div>

                <p className="demo-note">
                  Live breakdown of your post statuses.
                </p>
              </section>

              <section className="panel topics-panel">
                <div className="panel-heading">
                  <h3>
                    <span className="heading-icon">♨</span>
                    Topics
                  </h3>

                  <Link to="/" className="view-all-link">
                    Explore →
                  </Link>
                </div>

                <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                  Topic statistics will appear here when category
                  analytics are available.
                </p>
              </section>

              <section className="panel activity-panel">
                <div className="panel-heading">
                  <h3>
                    <span className="heading-icon">◷</span>
                    Recent Activity
                  </h3>
                </div>

                <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                  Your recent likes and comments will appear here
                  when the activity feed is connected.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
