
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Explore.css";

const getAuthor = (post) =>
  post.author?.name || post.author?.username || "BlogForge writer";

const getTags = (post) =>
  Array.isArray(post.tags)
    ? post.tags
        .map((tag) => (typeof tag === "string" ? tag : tag?.name))
        .filter(Boolean)
    : [];

const getExcerpt = (post) => {
  const text = post.excerpt || post.content || "";
  return text.length > 155 ? `${text.slice(0, 155).trim()}…` : text;
};

const getDate = (post) => {
  if (!post.publishedAt && !post.createdAt) return "";

  const date = new Date(post.publishedAt || post.createdAt);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All topics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/posts");
        const data = response.data?.data;
        const items = Array.isArray(data)
          ? data
          : data?.posts ?? data?.items ?? [];

        if (!cancelled) setPosts(items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load articles right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const topics = useMemo(() => {
    const unique = new Set();

    posts.forEach((post) => {
      getTags(post).forEach((tag) => unique.add(tag));
    });

    return ["All topics", ...Array.from(unique).sort().slice(0, 7)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const tags = getTags(post);
      const matchesSearch = !query ||
        `${post.title || ""} ${post.excerpt || ""} ${
          post.content || ""
        } ${tags.join(" ")} ${getAuthor(post)}`
          .toLowerCase()
          .includes(query);

      const matchesTag =
        activeTag === "All topics" || tags.includes(activeTag);

      return matchesSearch && matchesTag;
    });
  }, [posts, search, activeTag]);

  const featuredPost = !search && activeTag === "All topics"
    ? filteredPosts[0]
    : null;

  const articlePosts = featuredPost
    ? filteredPosts.filter(
        (post) => (post._id || post.id) !==
          (featuredPost._id || featuredPost.id)
      )
    : filteredPosts;

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <div className="explore-hero-copy">
          <span className="explore-kicker">
            <span className="explore-kicker-dot" />
            THE BLOGFORGE COMMUNITY
          </span>

          <h1>
            Good ideas deserve
            <br />
            <span>a place to grow.</span>
          </h1>

          <p>
            Discover practical tutorials, thoughtful perspectives, and
            ideas shared by developers building things that matter.
          </p>

          <label className="explore-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles, topics, or authors..."
              aria-label="Search published articles"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <div className="explore-hero-meta">
            <span><strong>{posts.length}</strong> articles to explore</span>
            <span>Written by developers, for developers</span>
          </div>
        </div>

        <div className="explore-hero-art" aria-hidden="true">
          <div className="explore-art-orbit orbit-one" />
          <div className="explore-art-orbit orbit-two" />
          <div className="explore-art-core">
            <span>B.</span>
          </div>
          <div className="explore-art-label art-label-top">IDEAS</div>
          <div className="explore-art-label art-label-bottom">
            BUILD · SHARE · GROW
          </div>
          <div className="explore-art-spark spark-one">✳</div>
          <div className="explore-art-spark spark-two">+</div>
        </div>
      </section>

      <section className="explore-results">
        <div className="explore-topic-row">
          <div>
            <span className="explore-section-kicker">THE LIBRARY</span>
            <h2>Explore ideas<span>.</span></h2>
          </div>

          <span className="explore-results-count">
            {loading ? "Loading articles…" :
              `${filteredPosts.length} ${
                filteredPosts.length === 1 ? "article" : "articles"
              }`}
          </span>
        </div>

        <div className="explore-topics" aria-label="Filter by topic">
          {topics.map((topic) => (
            <button
              type="button"
              key={topic}
              className={activeTag === topic ? "active" : ""}
              onClick={() => setActiveTag(topic)}
            >
              {topic === "All topics" && <span aria-hidden="true">▦</span>}
              {topic}
            </button>
          ))}
        </div>

        {loading && (
          <div className="explore-state">
            <span className="explore-state-mark">B.</span>
            <h3>Finding something worth reading…</h3>
            <p>Loading the latest articles from the community.</p>
          </div>
        )}

        {!loading && error && (
          <div className="explore-state explore-state-error" role="alert">
            <h3>Articles couldn't be loaded</h3>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="explore-state">
            <span className="explore-state-mark">⌕</span>
            <h3>No matching articles</h3>
            <p>
              Try another search or choose a different topic.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveTag("All topics");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && featuredPost && (
          <article className="explore-featured">
            <div className="explore-featured-content">
              <div className="explore-featured-topline">
                <span className="explore-featured-badge">
                  EDITOR'S PICK
                </span>
                <span>{getDate(featuredPost)}</span>
              </div>

              <h3>{featuredPost.title}</h3>

              <p>
                {getExcerpt(featuredPost) ||
                  "Discover this story from the BlogForge community."}
              </p>

              <div className="explore-featured-bottom">
                <div className="explore-author">
                  <span className="explore-author-avatar">
                    {getAuthor(featuredPost).charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <small>WRITTEN BY</small>
                    <strong>{getAuthor(featuredPost)}</strong>
                  </span>
                </div>

                <Link
                  to={`/posts/${encodeURIComponent(featuredPost.slug)}`}
                  className="explore-featured-link"
                >
                  Read story <span>↗</span>
                </Link>
              </div>
            </div>

            <div className="explore-featured-art" aria-hidden="true">
              <div className="explore-featured-art-ring" />
              <span className="explore-featured-letter">B.</span>
              <span className="explore-featured-art-caption">
                A STORY IN PROGRESS
              </span>
            </div>
          </article>
        )}

        {!loading && !error && articlePosts.length > 0 && (
          <div className="explore-grid-heading">
            <h3>{featuredPost ? "More to discover" : "Stories for you"}</h3>
            <span>Fresh perspectives from the community</span>
          </div>
        )}

        {!loading && !error && articlePosts.length > 0 && (
          <div className="explore-grid">
            {articlePosts.map((post, index) => {
              const tags = getTags(post);
              const author = getAuthor(post);

              return (
                <article
                  className="explore-card"
                  key={post._id || post.id}
                >
                  <div className={`explore-card-art art-variant-${index % 3}`}>
                    <span className="explore-card-art-mark">B.</span>
                    <span className="explore-card-art-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="explore-card-art-lines" />
                  </div>

                  <div className="explore-card-body">
                    <div className="explore-card-meta">
                      <span>ARTICLE</span>
                      {getDate(post) && <span>{getDate(post)}</span>}
                    </div>

                    <h3>{post.title || "Untitled article"}</h3>

                    <p className="explore-card-excerpt">
                      {getExcerpt(post) ||
                        "Read this article from the BlogForge community."}
                    </p>

                    {tags.length > 0 && (
                      <div className="explore-tags">
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="explore-card-footer">
                      <div className="explore-card-author">
                        <span className="explore-author-avatar">
                          {author.charAt(0).toUpperCase()}
                        </span>
                        <span>{author}</span>
                      </div>

                      <Link
                        to={`/posts/${encodeURIComponent(post.slug)}`}
                        aria-label={`Read ${post.title || "article"}`}
                      >
                        ↗
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
