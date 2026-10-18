
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./MyPosts.css";

const STATUS_META = {
  DRAFT: { label: "Draft", className: "draft" },
  SUBMITTED: { label: "Submitted", className: "submitted" },
  UNDER_REVIEW: { label: "In review", className: "review" },
  APPROVED: { label: "Approved", className: "approved" },
  PUBLISHED: { label: "Published", className: "published" },
  REJECTED: { label: "Rejected", className: "rejected" },
  ARCHIVED: { label: "Archived", className: "archived" },
  REMOVED: { label: "Removed", className: "removed" },
};

function normalizePosts(response) {
  const data = response?.data?.data ?? response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function getPostId(post) {
  return post?._id || post?.id;
}

function getRejectionReason(post) {
  return (
    post?.moderation?.rejectionReason ||
    post?.rejectionReason ||
    post?.moderationReason ||
    post?.reviewNote ||
    ""
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function MyPosts() {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message || "");
  const [filter, setFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState("");

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get("/posts/mine");
        setPosts(normalizePosts(response));
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load your posts. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const submitForReview = async (post) => {
    const postId = getPostId(post);

    if (!postId || actionId) return;

    setActionId(postId);
    setError("");
    setNotice("");

    try {
      await api.patch(`/posts/${postId}/submit`);

      setNotice(`"${post.title}" was submitted for moderation.`);
      await loadPosts(true);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to submit this post. Check its status and try again."
      );
    } finally {
      setActionId("");
    }
  };

  const visiblePosts = posts.filter((post) => {
    if (filter === "ALL") return true;

    return String(post.status || "").toUpperCase() === filter;
  });

  const counts = posts.reduce((result, post) => {
    const status = String(post.status || "").toUpperCase();
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});

  return (
    <main className="my-posts-page">
      <div className="my-posts-shell">
        <header className="my-posts-header">
          <div>
            <span className="my-posts-eyebrow">
              BLOGFORGE / YOUR WORKSPACE
            </span>

            <h1>
              My <span>posts.</span>
            </h1>

            <p>
              Manage your writing, follow moderation decisions, and
              get your next article ready for readers.
            </p>
          </div>

          <Link className="my-posts-create" to="/create-post">
            + Write a post
          </Link>
        </header>

        {notice && (
          <div className="my-posts-notice" role="status">
            <span>{notice}</span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="my-posts-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadPosts(true)}
              disabled={refreshing}
            >
              Retry
            </button>
          </div>
        )}

        <section className="my-posts-stats" aria-label="Post statistics">
          <div className="my-posts-stat">
            <span>Total posts</span>
            <strong>{posts.length}</strong>
          </div>

          <div className="my-posts-stat">
            <span>Drafts</span>
            <strong>{counts.DRAFT || 0}</strong>
          </div>

          <div className="my-posts-stat">
            <span>In review</span>
            <strong>
              {(counts.SUBMITTED || 0) + (counts.UNDER_REVIEW || 0)}
            </strong>
          </div>

          <div className="my-posts-stat">
            <span>Published</span>
            <strong>{counts.PUBLISHED || 0}</strong>
          </div>
        </section>

        <div className="my-posts-toolbar">
          <div>
            <h2>Your writing</h2>
            <p>{visiblePosts.length} posts shown</p>
          </div>

          <div className="my-posts-controls">
            <label
              className="my-posts-filter-label"
              htmlFor="post-filter"
            >
              Filter
            </label>

            <select
              id="post-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="ALL">All posts</option>
              <option value="DRAFT">Drafts</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">In review</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
              <option value="REMOVED">Removed</option>
            </select>

            <button
              type="button"
              className="my-posts-refresh"
              onClick={() => loadPosts(true)}
              disabled={refreshing || loading}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="my-posts-state">
            <div className="my-posts-loader" />
            <p>Loading your writing...</p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <section className="my-posts-empty">
            <span className="my-posts-empty-icon">✎</span>

            <h2>
              {filter === "ALL"
                ? "Your story starts here."
                : "No posts in this category."}
            </h2>

            <p>
              {filter === "ALL"
                ? "Create your first article, save it as a draft, and submit it when you are ready."
                : "Try another filter or create a new post."}
            </p>

            {filter === "ALL" && (
              <Link to="/create-post" className="my-posts-create">
                Create your first post
              </Link>
            )}
          </section>
        ) : (
          <section className="my-posts-list">
            {visiblePosts.map((post) => {
              const postId = getPostId(post);
              const status = String(post.status || "DRAFT").toUpperCase();

              const statusMeta = STATUS_META[status] || {
                label: status.replaceAll("_", " "),
                className: "unknown",
              };

              const rejectionReason = getRejectionReason(post);
              const canEdit = ["DRAFT", "REJECTED"].includes(status);
              const canSubmit = ["DRAFT", "REJECTED"].includes(status);
              const tags = Array.isArray(post.tags) ? post.tags : [];

              return (
                <article className="my-post-card" key={postId}>
                  <div className="my-post-card-main">
                    <div className="my-post-card-top">
                      <span
                        className={`my-post-status ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>

                      <span className="my-post-date">
                        Updated{" "}
                        {formatDate(post.updatedAt || post.createdAt)}
                      </span>
                    </div>

                    <h3>{post.title || "Untitled post"}</h3>

                    <p className="my-post-excerpt">
                      {post.excerpt ||
                        (post.content
                          ? `${post.content.slice(0, 180)}${
                              post.content.length > 180 ? "..." : ""
                            }`
                          : "No introduction added yet.")}
                    </p>

                    {tags.length > 0 && (
                      <div className="my-post-tags">
                        {tags.slice(0, 5).map((tag, index) => {
                          const name =
                            typeof tag === "string" ? tag : tag?.name;

                          return name ? (
                            <span key={`${name}-${index}`}>{name}</span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {status === "REJECTED" && rejectionReason && (
                      <div className="my-post-feedback">
                        <strong>Moderator feedback</strong>
                        <p>{rejectionReason}</p>
                      </div>
                    )}

                    {status === "REJECTED" && !rejectionReason && (
                      <div className="my-post-feedback">
                        <strong>Revision needed</strong>
                        <p>
                          This post was rejected. Review the moderator's
                          feedback in the moderation history if available.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="my-post-card-actions">
                    {status === "PUBLISHED" && post.slug && (
                      <Link
                        className="my-post-action secondary"
                        to={`/posts/${encodeURIComponent(post.slug)}`}
                      >
                        Read post
                      </Link>
                    )}

                    {canEdit && (
                      <Link
                        className="my-post-action secondary"
                        to={`/edit-post/${postId}`}
                      >
                        Edit
                      </Link>
                    )}

                    {canSubmit && (
                      <button
                        type="button"
                        className="my-post-action primary"
                        onClick={() => submitForReview(post)}
                        disabled={Boolean(actionId)}
                      >
                        {actionId === postId
                          ? "Submitting..."
                          : status === "REJECTED"
                            ? "Resubmit for review"
                            : "Submit for review"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="my-posts-footer">
          <Link to="/dashboard">← Back to dashboard</Link>
          <span>Write thoughtfully. Build in public.</span>
        </footer>
      </div>
    </main>
  );
}
