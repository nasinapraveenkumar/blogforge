
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

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

  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    pending: 0,
    drafts: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          console.warn("Profile could not be loaded:", profileError);
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
        if (cancelled) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your dashboard."
        );
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

  const visiblePosts = useMemo(
    () =>
      posts.filter((post) =>
        (post.title || "").toLowerCase().includes(search.toLowerCase())
      ),
    [posts, search]
  );

  const displayName =
    user?.name || user?.fullName || user?.username || "Writer";

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

  const donutSegments = [];
  let angle = 0;

  for (const item of statusItems) {
    const start = angle;
    angle += statusTotal ? (item.count / statusTotal) * 360 : 0;
    donutSegments.push(`${item.color} ${start}deg ${angle}deg`);
  }

  const donutGradient = statusTotal
    ? `conic-gradient(${donutSegments.join(", ")})`
    : "conic-gradient(#e8efed 0deg 360deg)";

  return (
    <div className="dashboard-page-content">
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
          <p>A platform where developers turn ideas into impact.</p>
          <span className="quote-author">— BlogForge</span>
        </div>

        <div className="welcome-decoration decoration-one" />
        <div className="welcome-decoration decoration-two" />
      </section>

      {error && (
        <div className="dashboard-error" role="alert">
          <strong>Unable to load dashboard</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid" aria-label="Blog statistics">
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
                <span className="panel-kicker">CONTENT INSIGHTS</span>
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

            <div className="dashboard-status-grid">
              {statusItems.map((item) => (
                <div className="dashboard-status-card" key={item.label}>
                  <span
                    className="dashboard-status-dot"
                    style={{ background: item.color }}
                  />

                  <strong>{loading ? "—" : item.count}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <p className="demo-note">
              Counts are based on your actual posts and their current statuses.
            </p>
          </section>

          <section className="panel recent-posts-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">CONTENT MANAGEMENT</span>
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
              Views and likes will appear when those metrics are available
              from the backend.
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
                  background: loading ? "#e8efed" : donutGradient,
                }}
              >
                <div>
                  <strong>{loading ? "—" : statusTotal}</strong>
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

            <p className="dashboard-placeholder">
              Topic statistics will appear here when category analytics
              are available.
            </p>
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading">
              <h3>
                <span className="heading-icon">◷</span>
                Recent Activity
              </h3>
            </div>

            <p className="dashboard-placeholder">
              Your recent likes and comments will appear here when the
              activity feed is connected.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
