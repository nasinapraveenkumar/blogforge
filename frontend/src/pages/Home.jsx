
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Home.css";

const topics = [
  "All topics",
  "Web Development",
  "Backend",
  "Databases",
  "DevOps",
  "AI & ML",
];

function getPostList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.posts)) return responseData.posts;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.data?.posts)) {
    return responseData.data.posts;
  }
  return [];
}

function getPostText(post) {
  const value = post?.excerpt || post?.content || post?.body || "";

  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : "";
}

function getAuthor(post) {
  return (
    post?.author?.name ||
    post?.author?.username ||
    post?.authorName ||
    "Community member"
  );
}

function getTopic(post) {
  const category =
    typeof post?.category === "string"
      ? post.category
      : post?.category?.name || "";

  const firstTag = post?.tags?.[0];

  const tagName =
    typeof firstTag === "string"
      ? firstTag
      : firstTag?.name || "";

  const value = `${category} ${tagName}`.toLowerCase();

  if (value.includes("database") || value.includes("mongo")) {
    return "Databases";
  }

  if (
    value.includes("devops") ||
    value.includes("deploy") ||
    value.includes("docker")
  ) {
    return "DevOps";
  }

  if (value.includes("ai") || value.includes("machine learning")) {
    return "AI & ML";
  }

  if (
    value.includes("backend") ||
    value.includes("api") ||
    value.includes("node")
  ) {
    return "Backend";
  }

  return category || tagName || "Web Development";
}

function formatDate(date) {
  if (!date) return "Recently published";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently published";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getArticleUrl(post) {
  return post?.slug
    ? `/posts/${encodeURIComponent(post.slug)}`
    : null;
}

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All topics");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/posts");
      setPosts(getPostList(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load articles. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter((post) => {
      const title = post.title || "";
      const content = getPostText(post);
      const author = getAuthor(post);
      const topic = getTopic(post);

      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query) ||
        author.toLowerCase().includes(query) ||
        topic.toLowerCase().includes(query);

      const matchesTopic =
        activeTopic === "All topics" ||
        topic.toLowerCase().includes(activeTopic.toLowerCase()) ||
        (activeTopic === "Web Development" &&
          !["Backend", "Databases", "DevOps", "AI & ML"].includes(topic));

      return matchesSearch && matchesTopic;
    });
  }, [posts, search, activeTopic]);

  const featuredPost = filteredPosts[0];
  const latestPosts = filteredPosts.slice(1);

  return (
    <main className="home-page">
      <div className="home-atmosphere" aria-hidden="true" />

      {/* Hero */}
      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            A community for developers
          </div>

          <h1>
            Build ideas.
            <br />
            <span>Share knowledge.</span>
            <br />
            Grow together.
          </h1>

          <p className="hero-description">
            A place for developers to share what they build, document what
            they learn, and discover ideas worth exploring.
          </p>

          <div className="hero-actions">
            <Link
              to="/register"
              className="home-button home-button-primary"
            >
              Start writing <span aria-hidden="true">↗</span>
            </Link>

            <a
              href="#latest-stories"
              className="home-button home-button-secondary"
            >
              Explore stories <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-note">
            <span className="hero-note-icon">✳</span>
            <span>Built for people who love building things.</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />

          <div className="hero-glass-card hero-code-card">
            <div className="code-window-top">
              <div className="window-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="code-file-name">hello-world.js</span>
              <span className="code-live-dot" />
            </div>

            <div className="code-content" aria-label="Example code">
              <p>
                <span className="code-muted">01</span>{" "}
                <span className="code-purple">const</span>{" "}
                <span className="code-blue">ideas</span> = [];
              </p>
              <p>
                <span className="code-muted">02</span>{" "}
                <span className="code-purple">function</span>{" "}
                <span className="code-mint">shareKnowledge</span>() {"{"}
              </p>
              <p>
                <span className="code-muted">03</span>
                <span className="code-indent" />
                <span className="code-purple">return</span>{" "}
                <span className="code-yellow">
                  "Something meaningful"
                </span>;
              </p>
              <p>
                <span className="code-muted">04</span> {"}"}
              </p>
              <p className="code-last-line">
                <span className="code-muted">05</span>{" "}
                <span className="code-comment">
                  // Your next idea starts here.
                </span>
              </p>
            </div>

            <div className="code-card-footer">
              <span className="code-footer-mark">B</span>
              <div>
                <strong>Ideas into impact.</strong>
                <span>One story at a time.</span>
              </div>
              <span className="code-footer-arrow">↗</span>
            </div>
          </div>

          <div className="floating-glass floating-glass-top">
            <span className="floating-icon">✳</span>
            <div>
              <strong>Learn by sharing</strong>
              <span>Every experience matters</span>
            </div>
          </div>

          <div className="floating-glass floating-glass-bottom">
            <span className="floating-spark">↗</span>
            <div>
              <strong>Keep building</strong>
              <span>Keep getting better</span>
            </div>
          </div>

          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />
        </div>
      </section>

      {/* Community strip */}
      <section className="home-community-strip">
        <div className="community-strip-copy">
          <span className="community-strip-indicator" />
          <span>Curiosity brings us together.</span>
        </div>
        <span className="community-strip-right">
          Code · Creativity · Community
        </span>
      </section>

      {/* Public blog feed */}
      <section className="home-feed" id="latest-stories">
        <div className="feed-heading">
          <div>
            <p className="feed-eyebrow">THE BLOGFORGE JOURNAL</p>
            <h2>
              Ideas from the community<span>.</span>
            </h2>
            <p className="feed-subtitle">
              Practical lessons, thoughtful experiments, and stories from
              developers building in the real world.
            </p>
          </div>

          <div className="feed-count">
            <span>{filteredPosts.length.toString().padStart(2, "0")}</span>
            <span>stories</span>
          </div>
        </div>

        {/* Search and topic filters */}
        <div className="feed-toolbar">
          <div
            className="topic-filters"
            aria-label="Filter articles by topic"
          >
            {topics.map((topic) => (
              <button
                type="button"
                key={topic}
                className={`topic-chip ${
                  activeTopic === topic ? "topic-chip-active" : ""
                }`}
                onClick={() => setActiveTopic(topic)}
                aria-pressed={activeTopic === topic}
              >
                {topic === "All topics" && (
                  <span className="topic-chip-dot" />
                )}
                {topic}
              </button>
            ))}
          </div>

          <label className="feed-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search stories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search stories"
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
        </div>

        {/* Loading state */}
        {loading && (
          <div className="feed-state glass-surface">
            <span className="loading-orb" />
            <h3>Finding something interesting...</h3>
            <p>Loading the latest community stories.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="feed-state glass-surface">
            <span className="state-icon state-icon-error">!</span>
            <h3>We couldn't load the stories.</h3>
            <p>{error}</p>
            <button
              type="button"
              className="home-button home-button-primary"
              onClick={fetchPosts}
            >
              Try again <span aria-hidden="true">↻</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="feed-state glass-surface">
            <span className="state-icon">✳</span>
            <h3>
              {search || activeTopic !== "All topics"
                ? "No stories found"
                : "The next story could be yours."}
            </h3>
            <p>
              {search || activeTopic !== "All topics"
                ? "Try another search or choose a different topic."
                : "Published articles will appear here when they're ready."}
            </p>

            {(search || activeTopic !== "All topics") && (
              <button
                type="button"
                className="home-button home-button-secondary"
                onClick={() => {
                  setSearch("");
                  setActiveTopic("All topics");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Stories */}
        {!loading && !error && featuredPost && (
          <>
            <div className="featured-layout">
              {/* Clickable featured story */}
              {getArticleUrl(featuredPost) ? (
                <Link
                  to={getArticleUrl(featuredPost)}
                  className="featured-story glass-surface home-story-link"
                  aria-label={`Read ${featuredPost.title || "featured story"}`}
                >
                  <div className="featured-story-top">
                    <span className="story-label">
                      <span className="story-label-dot" />
                      FEATURED STORY
                    </span>
                    <span className="story-date">
                      {formatDate(
                        featuredPost.publishedAt || featuredPost.createdAt
                      )}
                    </span>
                  </div>

                  <div className="featured-story-content">
                    <p className="story-category">
                      {getTopic(featuredPost)}
                    </p>
                    <h3>{featuredPost.title || "Untitled story"}</h3>
                    <p className="story-excerpt">
                      {getPostText(featuredPost).slice(0, 230) ||
                        "A new idea from the BlogForge community. Explore what the author has been building and learning."}
                      {getPostText(featuredPost).length > 230 ? "..." : ""}
                    </p>
                  </div>

                  <div className="story-footer">
                    <div className="author-avatar">
                      {getAuthor(featuredPost).charAt(0).toUpperCase()}
                    </div>
                    <div className="author-details">
                      <strong>{getAuthor(featuredPost)}</strong>
                      <span>Community contributor</span>
                    </div>
                    <span className="story-read-mark" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </Link>
              ) : (
                <article className="featured-story glass-surface">
                  <div className="featured-story-top">
                    <span className="story-label">
                      <span className="story-label-dot" />
                      FEATURED STORY
                    </span>
                    <span className="story-date">
                      {formatDate(featuredPost.createdAt)}
                    </span>
                  </div>
                  <div className="featured-story-content">
                    <p className="story-category">
                      {getTopic(featuredPost)}
                    </p>
                    <h3>{featuredPost.title || "Untitled story"}</h3>
                    <p className="story-excerpt">
                      {getPostText(featuredPost)}
                    </p>
                  </div>
                  <div className="story-footer">
                    <div className="author-avatar">
                      {getAuthor(featuredPost).charAt(0).toUpperCase()}
                    </div>
                    <div className="author-details">
                      <strong>{getAuthor(featuredPost)}</strong>
                      <span>Community contributor</span>
                    </div>
                  </div>
                </article>
              )}

              <aside className="feed-side-panel glass-surface">
                <div className="side-panel-icon">✳</div>
                <p className="side-panel-eyebrow">A SMALL REMINDER</p>
                <h3>Your experience could help someone else.</h3>
                <p>
                  Share the bug you fixed, the lesson you learned, or the
                  project you're proud of.
                </p>
                <Link to="/register" className="side-panel-link">
                  Add your perspective <span>↗</span>
                </Link>
                <div className="side-panel-decoration" />
              </aside>
            </div>

            {/* Latest story cards */}
            {latestPosts.length > 0 && (
              <div className="latest-stories">
                <div className="latest-heading">
                  <div>
                    <p className="feed-eyebrow">FRESH PERSPECTIVES</p>
                    <h3>More to explore</h3>
                  </div>
                  <span className="latest-count">
                    {latestPosts.length} more{" "}
                    {latestPosts.length === 1 ? "story" : "stories"}
                  </span>
                </div>

                <div className="stories-grid">
                  {latestPosts.map((post) => {
                    const articleUrl = getArticleUrl(post);

                    const cardContent = (
                      <>
                        <div className="story-card-top">
                          <span className="story-category-pill">
                            {getTopic(post)}
                          </span>
                          <span
                            className="story-card-arrow"
                            aria-hidden="true"
                          >
                            ↗
                          </span>
                        </div>

                        <h4>{post.title || "Untitled story"}</h4>

                        <p className="story-card-excerpt">
                          {getPostText(post).slice(0, 145) ||
                            "Discover an idea, an experiment, or a lesson shared by a fellow developer."}
                          {getPostText(post).length > 145 ? "..." : ""}
                        </p>

                        {/* Display post tags */}
                        {Array.isArray(post.tags) && post.tags.length > 0 && (
                          <div className="story-card-tags">
                            {post.tags.slice(0, 3).map((tag, index) => {
                              const tagName =
                                typeof tag === "string"
                                  ? tag
                                  : tag?.name || "";

                              if (!tagName) return null;

                              return (
                                <span
                                  className="story-card-tag"
                                  key={tag?._id || tagName || index}
                                >
                                  #{tagName}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        <div className="story-card-footer">
                          <div className="author-avatar author-avatar-small">
                            {getAuthor(post).charAt(0).toUpperCase()}
                          </div>
                          <div className="story-card-author">
                            <strong>{getAuthor(post)}</strong>
                            <span>
                              {formatDate(post.publishedAt || post.createdAt)}
                            </span>
                          </div>
                        </div>
                      </>
                    );

                    return articleUrl ? (
                      <Link
                        to={articleUrl}
                        className="story-card glass-surface home-story-link"
                        key={post._id || post.id || post.slug || post.title}
                        aria-label={`Read ${post.title || "article"}`}
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      <article
                        className="story-card glass-surface"
                        key={post._id || post.id || post.title}
                      >
                        {cardContent}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom call to action */}
        <div className="home-bottom-cta">
          <div>
            <span className="bottom-cta-label">MADE FOR CURIOUS MINDS</span>
            <h3>Have something worth sharing?</h3>
            <p>
              Your next post might be exactly what another developer needs.
            </p>
          </div>
          <Link to="/register" className="home-button home-button-primary">
            Join BlogForge <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <Link to="/" className="footer-brand">
          <span className="footer-brand-icon">B</span>
          BlogForge
        </Link>
        <span>Write. Share. Grow.</span>
        <a href="#latest-stories">Back to stories ↑</a>
      </footer>
    </main>
  );
}

export default Home;
