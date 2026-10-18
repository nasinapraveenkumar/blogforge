
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminDashboard.css";

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

const getPostStatus = (post) =>
  String(post.status || (post.isPublished ? "published" : "draft"))
    .toLowerCase();

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [postStatus, setPostStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingUser, setUpdatingUser] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users", {
          params: {
            search: search || undefined,
            role: role || undefined,
          },
        }),
      ]);

      setStats(statsRes.data.data);
      setUsers(usersRes.data.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load admin data. Check your login and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError("");

    try {
      // Requires a GET /admin/posts endpoint in the backend.
      const response = await api.get("/admin/posts");
      const data = response.data.data;

      setPosts(Array.isArray(data) ? data : data?.posts || []);
    } catch (err) {
      setPostsError(
        err.response?.data?.message ||
          "Could not load posts. The admin posts API may not exist yet."
      );
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function changeRole(userId, newRole) {
    setError("");
    setMessage("");
    setUpdatingUser(userId);

    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });

      setMessage("Member role updated successfully.");
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update member role."
      );
    } finally {
      setUpdatingUser("");
    }
  }

  async function toggleStatus(user) {
    const userId = user.id || user._id;

    setError("");
    setMessage("");
    setUpdatingUser(userId);

    try {
      await api.patch(`/admin/users/${userId}/status`, {
        isActive: !user.isActive,
      });

      setMessage("Member status updated successfully.");
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update member status."
      );
    } finally {
      setUpdatingUser("");
    }
  }

  const filteredPosts = useMemo(() => {
    const query = postSearch.trim().toLowerCase();

    return posts.filter((post) => {
      const title = post.title || post.name || "Untitled post";
      const author =
        post.author?.name ||
        post.user?.name ||
        post.authorName ||
        "";

      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        author.toLowerCase().includes(query);

      const status = getPostStatus(post);
      const matchesStatus = !postStatus || status === postStatus;

      return matchesSearch && matchesStatus;
    });
  }, [posts, postSearch, postStatus]);

  const publishedCount = posts.filter(
    (post) => getPostStatus(post) === "published"
  ).length;

  const draftCount = posts.filter(
    (post) => getPostStatus(post) === "draft"
  ).length;

  const statCards = [
    {
      label: "Total members",
      value: stats?.totalUsers ?? "—",
      icon: "users",
      detail: "Registered accounts",
    },
    {
      label: "Active members",
      value: stats?.activeUsers ?? "—",
      icon: "user-check",
      detail: "Accounts with access",
    },
    {
      label: "Administrators",
      value: stats?.roles?.ADMIN ?? "—",
      icon: "shield-check",
      detail: "Platform administrators",
    },
    {
      label: "Moderators",
      value: stats?.roles?.MODERATOR ?? "—",
      icon: "shield",
      detail: "Community moderators",
    },
    {
      label: "Published posts",
      value: postsLoading ? "…" : publishedCount,
      icon: "file-text",
      detail: "Published content",
    },
    {
      label: "Draft posts",
      value: postsLoading ? "…" : draftCount,
      icon: "files",
      detail: "Unpublished content",
    },
  ];

  return (
    <main className="bf-admin">
      <header className="bf-admin-header">
        <div>
          <span className="bf-admin-eyebrow">
            BLOGFORGE / CONTROL CENTER
          </span>
          <h1>Admin dashboard<span>.</span></h1>
          <p>
            Manage members, oversee published content, and keep the
            community running smoothly.
          </p>
        </div>

        <button
          className="bf-admin-refresh"
          onClick={() => {
            loadDashboard();
            loadPosts();
          }}
          disabled={loading || postsLoading}
        >
          ↻ &nbsp; Refresh data
        </button>
      </header>

      {error && (
        <div className="bf-admin-notice error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {message && (
        <div className="bf-admin-notice success" role="status">
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="bf-admin-stats" aria-label="Platform statistics">
        {statCards.map((stat) => (
          <article className="bf-admin-stat" key={stat.label}>
            <div className="bf-admin-stat-top">
              <span>{stat.label}</span>
              <span className="bf-admin-stat-icon" aria-hidden="true">
                {stat.icon === "users" && "♧"}
                {stat.icon === "user-check" && "✓"}
                {stat.icon === "shield-check" && "⬡"}
                {stat.icon === "shield" && "◇"}
                {stat.icon === "file-text" && "▤"}
                {stat.icon === "files" && "▧"}
              </span>
            </div>
            <strong>{loading && stat.label !== "Published posts" &&
              stat.label !== "Draft posts" ? "…" : stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </section>

      <section className="bf-admin-panel">
        <div className="bf-admin-panel-heading">
          <div>
            <span className="bf-admin-eyebrow">ACCESS CONTROL</span>
            <h2>Member management</h2>
            <p>Manage account roles and platform access.</p>
          </div>
          <span className="bf-admin-total">
            {users.length} member{users.length === 1 ? "" : "s"} loaded
          </span>
        </div>

        <div className="bf-admin-filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search members"
          />

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filter members by role"
          >
            <option value="">All roles</option>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="bf-admin-table-wrap">
          <table className="bf-admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Account status</th>
                <th>Access control</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const userId = user.id || user._id;
                const photo = user.profilePhoto || user.avatar || "";

                return (
                  <tr key={userId}>
                    <td>
                      <div className="bf-admin-user">
                        {photo ? (
                          <img
                            className="bf-admin-avatar"
                            src={photo}
                            alt=""
                          />
                        ) : (
                          <span className="bf-admin-avatar">
                            {getInitials(user.name)}
                          </span>
                        )}

                        <div>
                          <strong>{user.name || "Unnamed member"}</strong>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        className="bf-admin-role-select"
                        value={user.role}
                        disabled={updatingUser === userId}
                        onChange={(event) =>
                          changeRole(userId, event.target.value)
                        }
                        aria-label={`Role for ${user.name}`}
                      >
                        <option value="USER">User</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>

                    <td>
                      <span
                        className={`bf-admin-status ${
                          user.isActive ? "active" : "inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="bf-admin-status-button"
                        disabled={updatingUser === userId}
                        onClick={() => toggleStatus(user)}
                      >
                        {updatingUser === userId
                          ? "Updating..."
                          : user.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="bf-admin-empty">
                    No members match your search.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={4} className="bf-admin-empty">
                    Loading members...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bf-admin-panel bf-admin-posts">
        <div className="bf-admin-panel-heading">
          <div>
            <span className="bf-admin-eyebrow">CONTENT OVERSIGHT</span>
            <h2>All posts</h2>
            <p>Review content across the platform, not just your own posts.</p>
          </div>
          <span className="bf-admin-total">
            {filteredPosts.length} post{filteredPosts.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="bf-admin-filters">
          <input
            value={postSearch}
            onChange={(event) => setPostSearch(event.target.value)}
            placeholder="Search post title or author..."
            aria-label="Search posts"
          />

          <select
            value={postStatus}
            onChange={(event) => setPostStatus(event.target.value)}
            aria-label="Filter posts by status"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {postsError && (
          <div className="bf-admin-notice error bf-admin-posts-error" role="alert">
            <span>{postsError}</span>
            <button onClick={loadPosts}>Retry</button>
          </div>
        )}

        <div className="bf-admin-table-wrap">
          <table className="bf-admin-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Author</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.map((post) => {
                const postId = post._id || post.id;
                const title = post.title || post.name || "Untitled post";
                const author =
                  post.author?.name ||
                  post.user?.name ||
                  post.authorName ||
                  "Unknown author";
                const status = getPostStatus(post);

                return (
                  <tr key={postId}>
                    <td>
                      <div className="bf-admin-post-title">
                        <strong>{title}</strong>
                        <small>
                          ID: {postId ? String(postId).slice(-8) : "—"}
                        </small>
                      </div>
                    </td>

                    <td>{author}</td>

                    <td>
                      <span
                        className={`bf-admin-status ${
                          status === "published" ? "active" : "inactive"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>{formatDate(post.createdAt || post.publishedAt)}</td>
                  </tr>
                );
              })}

              {!postsLoading && !postsError && filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="bf-admin-empty">
                    No posts match these filters.
                  </td>
                </tr>
              )}

              {postsLoading && (
                <tr>
                  <td colSpan={4} className="bf-admin-empty">
                    Loading posts...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="bf-admin-footer">
        <span>BlogForge Control Center</span>
        <span>Manage responsibly. Keep the community healthy.</span>
      </footer>
    </main>
  );
}
