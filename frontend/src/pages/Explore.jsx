
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Explore.css";

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
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

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return posts;

    return posts.filter((post) => {
      const tags = Array.isArray(post.tags)
        ? post.tags
            .map((tag) => typeof tag === "string" ? tag : tag?.name)
            .join(" ")
        : "";

      return `${post.title || ""} ${post.excerpt || ""} ${tags}`
        .toLowerCase()
        .includes(query);
    });
  }, [posts, search]);

  return (
    <main className="explore-page">
      <header className="explore-header">
        <span className="panel-kicker">THE BLOGFORGE COMMUNITY</span>
        <h1>Ideas worth <span>exploring.</span></h1>
        <p>Discover articles, tutorials, and ideas shared by developers.</p>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search articles, topics, or tags..."
          aria-label="Search published articles"
        />
      </header>

      <section className="explore-results">
        <div className="explore-results-heading">
          <h2>Discover articles</h2>
          <span>{filteredPosts.length} articles</span>
        </div>

        {loading && <p className="explore-message">Loading articles...</p>}

        {!loading && error && (
          <div className="explore-message explore-error" role="alert">
            {error}
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredPosts.length === 0 && (
          <div className="explore-empty">
            <h3>No articles found</h3>
            <p>
              {search
                ? "Try a different search term."
                : "Published articles will appear here when authors share them."}
            </p>
          </div>
        )}

        <div className="explore-grid">
          {filteredPosts.map((post) => {
            const author =
              post.author?.name ||
              post.author?.username ||
              "BlogForge writer";

            const tags = Array.isArray(post.tags) ? post.tags : [];

            return (
              <article className="explore-card" key={post._id || post.id}>
                <div className="explore-card-top">
                  <span className="explore-card-mark">B.</span>
                  <span>ARTICLE</span>
                </div>

                <h3>{post.title}</h3>

                <p className="explore-card-excerpt">
                  {post.excerpt ||
                    post.content?.slice(0, 160) ||
                    "Read this article from the BlogForge community."}
                </p>

                {tags.length > 0 && (
                  <div className="explore-tags">
                    {tags.slice(0, 3).map((tag, index) => {
                      const name =
                        typeof tag === "string" ? tag : tag?.name;

                      return name ? (
                        <span key={`${name}-${index}`}>{name}</span>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="explore-card-footer">
                  <span>By {author}</span>
                  <Link to={`/posts/${encodeURIComponent(post.slug)}`}>
                    Read article →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
