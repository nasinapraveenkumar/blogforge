
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Bookmarks.css";

function formatDate(date) {
  if (!date) return "Recently saved";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Recently saved";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAuthorName(author) {
  if (!author) return "Community member";
  if (typeof author === "string") return author;

  return author.name || author.username || "Community member";
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function Bookmarks() {
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [search, setSearch] = useState("");

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/bookmarks");
      const data = response.data?.data;

      setBookmarks(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        getErrorMessage(err, "Unable to load your saved stories.")
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  async function handleRemove(bookmark) {
    const post = bookmark.post;
    const postId =
      typeof post === "string" ? post : post?._id || post?.id;

    if (!postId || removingId) return;

    setRemovingId(postId);
    setError("");

    try {
      await api.delete(`/bookmarks/${postId}`);

      setBookmarks((current) =>
        current.filter((item) => {
          const itemPostId =
            typeof item.post === "string"
              ? item.post
              : item.post?._id || item.post?.id;

          return itemPostId !== postId;
        })
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to remove this bookmark.")
      );
    } finally {
      setRemovingId("");
    }
  }

  const visibleBookmarks = bookmarks.filter((bookmark) => {
    const post = bookmark.post;

    if (!post || typeof post !== "object") return false;

    const query = search.trim().toLowerCase();

    return (
      !query ||
      (post.title || "").toLowerCase().includes(query) ||
      (post.excerpt || "").toLowerCase().includes(query) ||
      getAuthorName(post.author).toLowerCase().includes(query)
    );
  });

  return (
    <main className="bookmarks-page">
      <div className="bookmarks-atmosphere" aria-hidden="true" />

      <header className="bookmarks-topbar">
        <Link to="/dashboard" className="bookmarks-brand">
          <span className="bookmarks-brand-mark">B</span>
          BlogForge
        </Link>

        <Link to="/dashboard" className="bookmarks-back-link">
          ← Dashboard
        </Link>
      </header>

      <section className="bookmarks-content">
        <div className="bookmarks-intro">
          <span className="bookmarks-eyebrow">YOUR READING SPACE</span>
          <h1>Saved <span>stories.</span></h1>
          <p>
            Keep the ideas worth returning to, all in one place.
          </p>
        </div>

        <div className="bookmarks-toolbar">
          <div className="bookmarks-count">
            <strong>{loading ? "—" : bookmarks.length}</strong>
            <span>
              {bookmarks.length === 1 ? "saved story" : "saved stories"}
            </span>
          </div>

          <label className="bookmarks-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search saved stories..."
              aria-label="Search saved stories"
            />
          </label>
        </div>

        {error && (
          <div className="bookmarks-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadBookmarks}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="bookmarks-state">
            <span className="bookmarks-spinner" />
            <h2>Gathering your stories...</h2>
            <p>Your reading list will be ready in a moment.</p>
          </div>
        ) : !error && bookmarks.length === 0 ? (
          <div className="bookmarks-state">
            <span className="bookmarks-empty-icon">♧</span>
            <h2>Your reading list starts here.</h2>
            <p>
              Browse published stories and save the ones you want to
              revisit.
            </p>
            <Link to="/" className="bookmarks-primary-button">
              Explore stories →
            </Link>
          </div>
        ) : !error && visibleBookmarks.length === 0 ? (
          <div className="bookmarks-state">
            <h2>No matching stories</h2>
            <p>Try a different search term.</p>
            <button
              type="button"
              className="bookmarks-secondary-button"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="bookmarks-grid">
            {visibleBookmarks.map((bookmark) => {
              const post = bookmark.post;
              const postId = post._id || post.id;

              return (
                <article className="bookmark-card" key={bookmark._id || postId}>
                  <div className="bookmark-card-top">
                    <span className="bookmark-card-label">
                      <span aria-hidden="true">♧</span> SAVED STORY
                    </span>

                    <button
                      type="button"
                      className="bookmark-remove-button"
                      onClick={() => handleRemove(bookmark)}
                      disabled={removingId === postId}
                      aria-label={`Remove ${post.title} from bookmarks`}
                      title="Remove bookmark"
                    >
                      {removingId === postId ? "…" : "×"}
                    </button>
                  </div>

                  {post.coverImage?.url && (
                    <Link
                      to={`/posts/${encodeURIComponent(post.slug)}`}
                      className="bookmark-cover-link"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img
                        src={post.coverImage.url}
                        alt=""
                        className="bookmark-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <div className="bookmark-card-content">
                    <h2>
                      <Link to={`/posts/${encodeURIComponent(post.slug)}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="bookmark-excerpt">{post.excerpt}</p>
                    )}

                    <div className="bookmark-meta">
                      <span>{getAuthorName(post.author)}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={bookmark.createdAt}>
                        Saved {formatDate(bookmark.createdAt)}
                      </time>
                    </div>

                    <div className="bookmark-card-footer">
                      <Link
                        to={`/posts/${encodeURIComponent(post.slug)}`}
                        className="bookmark-read-link"
                      >
                        Read story <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
