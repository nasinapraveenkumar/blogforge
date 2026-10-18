
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Community.css";

function getPosts(payload) {
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(payload?.posts)) return payload.posts;

  return [];
}

function getAuthorName(author) {
  if (!author) return "Community member";
  if (typeof author === "string") return author;

  return author.name || author.username || "Community member";
}

function getPostSlug(post) {
  return post.slug || post._id || post.id;
}

function formatDate(date) {
  if (!date) return "Recently published";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently published";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTags(post) {
  if (!Array.isArray(post.tags)) return [];

  return post.tags
    .map((tag) => (typeof tag === "string" ? tag : tag?.name))
    .filter(Boolean)
    .slice(0, 3);
}

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const loadCommunityPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/posts");
      const allPosts = getPosts(response.data);

      const publishedPosts = allPosts.filter((post) => {
        const status = String(post.status || "").toUpperCase();

        // Public community content should contain published posts only.
        // If the public API already filters unpublished posts, missing
        // status values are accepted.
        return !status || status === "PUBLISHED";
      });

      setPosts(publishedPosts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't load community stories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunityPosts();
  }, [loadCommunityPosts]);

  const availableTags = [
    "All",
    ...new Set(posts.flatMap((post) => getTags(post))),
  ];

  const filteredPosts = posts.filter((post) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      [post.title, post.excerpt, getAuthorName(post.author), post.content]
        .some((value) =>
          String(value || "").toLowerCase().includes(query)
        ) ||
      getTags(post).some((tag) => tag.toLowerCase().includes(query));

    const matchesTag =
      selectedTag === "All" || getTags(post).includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <main className="bf-community-page">
      <header className="bf-community-header">
        <div>
          <span className="bf-community-eyebrow">THE BLOGFORGE NETWORK</span>
          <h1>Community</h1>
          <p>
            Discover ideas, learn from other developers, and join
            conversations that help everyone grow.
          </p>
        </div>

        <Link to="/write" className="bf-community-write-button">
          <span aria-hidden="true">+</span>
          Write a story
        </Link>
      </header>

      <section className="bf-community-toolbar">
        <label className="bf-community-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search stories, topics, or authors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search community stories"
          />
        </label>

        <div className="bf-community-count">
          <strong>{filteredPosts.length}</strong>
          <span>
            {filteredPosts.length === 1 ? "story" : "stories"}
          </span>
        </div>
      </section>

      {!loading && posts.length > 0 && (
        <nav className="bf-community-tags" aria-label="Filter by topic">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={
                selectedTag === tag ? "is-active" : ""
              }
              onClick={() => setSelectedTag(tag)}
              aria-pressed={selectedTag === tag}
            >
              {tag === "All" ? "All topics" : `#${tag}`}
            </button>
          ))}
        </nav>
      )}

      {loading ? (
        <div className="bf-community-state">
          <span className="bf-community-loader" />
          <h2>Finding good stories...</h2>
          <p>Loading the latest community posts.</p>
        </div>
      ) : error ? (
        <div className="bf-community-state">
          <h2>Couldn't load the community</h2>
          <p>{error}</p>
          <button
            type="button"
            className="bf-community-retry"
            onClick={loadCommunityPosts}
          >
            Try again
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bf-community-state">
          <span className="bf-community-empty-mark" aria-hidden="true">
            ✳
          </span>
          <h2>
            {posts.length === 0
              ? "The community is just getting started"
              : "No stories match your search"}
          </h2>
          <p>
            {posts.length === 0
              ? "Publish a story to give other developers something to discover."
              : "Try another search or choose a different topic."}
          </p>

          {posts.length > 0 && (
            <button
              type="button"
              className="bf-community-retry"
              onClick={() => {
                setSearch("");
                setSelectedTag("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <section className="bf-community-grid" aria-label="Community stories">
          {filteredPosts.map((post) => {
            const slug = getPostSlug(post);
            const authorName = getAuthorName(post.author);
            const tags = getTags(post);
            const coverImage =
              typeof post.coverImage === "string"
                ? post.coverImage
                : post.coverImage?.url;

            return (
              <article
                className="bf-community-card"
                key={post._id || post.id || slug}
              >
                {coverImage && (
                  <Link
                    to={`/posts/${encodeURIComponent(slug)}`}
                    className="bf-community-cover"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={coverImage}
                      alt=""
                      loading="lazy"
                    />
                  </Link>
                )}

                <div className="bf-community-card-content">
                  {tags.length > 0 && (
                    <div className="bf-community-card-tags">
                      {tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <h2>
                    <Link to={`/posts/${encodeURIComponent(slug)}`}>
                      {post.title || "Untitled story"}
                    </Link>
                  </h2>

                  <p className="bf-community-excerpt">
                    {post.excerpt ||
                      String(post.content || "")
                        .replace(/\s+/g, " ")
                        .slice(0, 160) ||
                      "Open this story to read more."}
                  </p>

                  <footer className="bf-community-card-footer">
                    <div className="bf-community-author">
                      <span className="bf-community-avatar">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{authorName}</strong>
                        <time>
                          {formatDate(
                            post.publishedAt || post.createdAt
                          )}
                        </time>
                      </div>
                    </div>

                    <Link
                      to={`/posts/${encodeURIComponent(slug)}`}
                      className="bf-community-read-link"
                      aria-label={`Read ${post.title || "story"}`}
                    >
                      Read story <span aria-hidden="true">↗</span>
                    </Link>
                  </footer>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
