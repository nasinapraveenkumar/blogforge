
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./MyPosts.css";

const filters = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Published",
  "Rejected",
];

function formatStatus(status = "UNKNOWN") {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status = "unknown") {
  return status.toLowerCase().replaceAll("_", "-");
}

export default function MyPosts() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    published: 0,
    pending: 0,
    drafts: 0,
    rejected: 0,
  });

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/posts/mine");
      const result = response.data?.data;

      if (!result || !Array.isArray(result.posts)) {
        throw new Error("Unexpected response from the posts API.");
      }

      setPosts(result.posts);
      setStats({
        totalPosts: result.stats?.totalPosts ?? result.posts.length,
        published: result.stats?.published ?? 0,
        pending: result.stats?.pending ?? 0,
        drafts: result.stats?.drafts ?? 0,
        rejected: result.stats?.rejected ?? 0,
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load your posts."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const matchesSearch = title.includes(query);
      const status = (post.status || "").toUpperCase();

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Draft" && status === "DRAFT") ||
        (activeFilter === "Submitted" && status === "SUBMITTED") ||
        (activeFilter === "Under Review" &&
          status === "UNDER_REVIEW") ||
        (activeFilter === "Published" && status === "PUBLISHED") ||
        (activeFilter === "Rejected" && status === "REJECTED");

      return matchesSearch && matchesFilter;
    });
  }, [posts, search, activeFilter]);

  const statCards = [
    { label: "Total posts", value: stats.totalPosts, symbol: "▤" },
    { label: "Published", value: stats.published, symbol: "✓" },
    { label: "Pending review", value: stats.pending, symbol: "◷" },
    { label: "Drafts", value: stats.drafts, symbol: "✎" },
  ];

  return (
    <main className="my-posts-page">
      <header className="my-posts-header">
        <div>
          <Link to="/dashboard" className="my-posts-back">
            ← Dashboard
          </Link>

          <p className="my-posts-eyebrow">CONTENT MANAGEMENT</p>
          <h1>My Posts</h1>
          <p className="my-posts-description">
            Manage your articles, track moderation, and keep writing.
          </p>
        </div>

        <Link to="/write" className="my-posts-create">
          <span>＋</span> Create a post
        </Link>
      </header>

      <section className="my-posts-stats" aria-label="Post statistics">
        {statCards.map((stat) => (
          <article className="my-posts-stat" key={stat.label}>
            <span className="my-posts-stat-icon">{stat.symbol}</span>
            <div>
              <strong>{loading ? "—" : stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="my-posts-panel">
        <div className="my-posts-toolbar">
          <label className="my-posts-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search by post title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search posts by title"
            />
          </label>

          <span className="my-posts-count">
            {loading ? "Loading..." : `${visiblePosts.length} posts`}
          </span>
        </div>

        <div
          className="my-posts-filters"
          aria-label="Filter posts by status"
        >
          {filters.map((filter) => (
            <button
              type="button"
              key={filter}
              className={`my-posts-filter ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>

        {error && (
          <div className="my-posts-error" role="alert">
            <strong>Unable to load posts</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={loadPosts}
              disabled={loading}
            >
              {loading ? "Retrying..." : "Try again"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="my-posts-empty" aria-live="polite">
            <span className="my-posts-empty-icon">◷</span>
            <h2>Loading your posts</h2>
            <p>Fetching your latest articles from BlogForge.</p>
          </div>
        ) : !error && visiblePosts.length === 0 ? (
          <div className="my-posts-empty">
            <span className="my-posts-empty-icon">▤</span>
            <h2>
              {posts.length === 0
                ? "Your writing journey starts here"
                : "No matching posts"}
            </h2>
            <p>
              {posts.length === 0
                ? "Create your first article and share your knowledge."
                : "Try another search term or status filter."}
            </p>

            {posts.length === 0 && (
              <Link to="/write" className="my-posts-create">
                ＋ Create your first post
              </Link>
            )}
          </div>
        ) : (
          <div className="my-posts-table-wrap">
            <table className="my-posts-table">
              <thead>
                <tr>
                  <th scope="col">Article</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {visiblePosts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <div className="my-posts-article">
                        <span className="my-posts-thumbnail">
                          {(post.title || "BP")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>{post.title || "Untitled post"}</strong>
                          <span>
                            {post.slug
                              ? `/${post.slug}`
                              : "BlogForge article"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`my-posts-status status-${getStatusClass(
                          post.status
                        )}`}
                      >
                        <span aria-hidden="true" />
                        {formatStatus(post.status)}
                      </span>
                    </td>

                    <td className="my-posts-date">
                      {formatDate(post.createdAt)}
                    </td>

                    <td>
                      {post.status === "PUBLISHED" && post.slug ? (
                        <Link
                          className="my-posts-action"
                          to={`/posts/${encodeURIComponent(post.slug)}`}
                        >
                          View article
                        </Link>
                      ) : (
                        <span className="my-posts-action-muted">
                          {post.status === "REJECTED"
                            ? "Needs revision"
                            : post.status === "DRAFT"
                              ? "Draft saved"
                              : "In progress"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="my-posts-footer">
        <span>BlogForge</span>
        <span>Your ideas deserve to be shared.</span>
      </footer>
    </main>
  );
}
