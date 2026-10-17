
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import "./Article.css";

function formatDate(date) {
  if (!date) return "Recently published";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Recently published";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getAuthorName(author) {
  if (!author) return "Community member";
  if (typeof author === "string") return author;

  return author.name || author.username || "Community member";
}

function getId(value) {
  if (!value) return "";

  return typeof value === "string"
    ? value
    : value._id || value.id || "";
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function Article() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState("");

  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

  const postId = getId(post);
  const userId = getId(currentUser);

  const loadComments = useCallback(async (id) => {
    if (!id) return;

    setCommentsLoading(true);
    setCommentError("");

    try {
      const response = await api.get(`/comments/${id}`);
      const data = response.data?.data;

      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setCommentError(
        getErrorMessage(err, "Unable to load comments.")
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const loadLikeSummary = useCallback(async (id) => {
    if (!id) return;

    try {
      const response = await api.get(`/likes/summary/${id}`);
      const summary = response.data?.data;

      setLikeCount(Number(summary?.likeCount) || 0);
      setLiked(Boolean(summary?.liked));
    } catch {
      // Keep the article readable if like information is unavailable.
    }
  }, []);

  const loadBookmarkStatus = useCallback(
    async (id, authenticatedUserId) => {
      if (!id || !authenticatedUserId) {
        setIsBookmarked(false);
        return;
      }

      try {
        const response = await api.get("/bookmarks");
        const bookmarks = response.data?.data;

        const saved = Array.isArray(bookmarks)
          ? bookmarks.some((bookmark) => {
              const bookmarkedPostId = getId(bookmark.post);
              return bookmarkedPostId === id;
            })
          : false;

        setIsBookmarked(saved);
      } catch {
        // Do not block reading if bookmarks cannot be loaded.
        setIsBookmarked(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function fetchArticle() {
      setLoading(true);
      setError("");
      setPost(null);
      setComments([]);
      setLikeCount(0);
      setLiked(false);
      setIsBookmarked(false);
      setBookmarkMessage("");
      setCommentError("");
      setCommentMessage("");

      try {
        const response = await api.get(
          `/posts/${encodeURIComponent(slug)}`
        );

        const article = response.data?.data;

        if (!article) {
          throw new Error("Article not found.");
        }

        if (active) {
          setPost(article);
        }
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load this article.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchArticle();

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await api.get("/auth/me");
        const result = response.data?.data;

        const user =
          result?.user ||
          response.data?.user ||
          result ||
          null;

        if (active) {
          setCurrentUser(user);
        }
      } catch {
        if (active) {
          setCurrentUser(null);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!postId) return;

    loadComments(postId);
    loadLikeSummary(postId);
  }, [postId, loadComments, loadLikeSummary]);

  useEffect(() => {
    if (!postId) return;

    loadBookmarkStatus(postId, userId);
  }, [postId, userId, loadBookmarkStatus]);

  async function handleLike() {
    if (!userId) return;

    if (likeLoading || !postId) return;

    setLikeLoading(true);
    setCommentError("");

    try {
      const response = liked
        ? await api.delete(`/likes/${postId}`)
        : await api.post(`/likes/${postId}`);

      const summary = response.data?.data;

      if (summary && typeof summary.likeCount === "number") {
        setLikeCount(summary.likeCount);
        setLiked(Boolean(summary.liked));
      } else {
        await loadLikeSummary(postId);
      }
    } catch (err) {
      setCommentError(
        getErrorMessage(err, "Unable to update your like.")
      );
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleBookmark() {
    if (!userId || !postId || bookmarkLoading) return;

    setBookmarkLoading(true);
    setBookmarkMessage("");

    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${postId}`);
        setIsBookmarked(false);
        setBookmarkMessage("Removed from your saved stories.");
      } else {
        await api.post(`/bookmarks/${postId}`);
        setIsBookmarked(true);
        setBookmarkMessage("Story saved to your bookmarks.");
      }
    } catch (err) {
      setBookmarkMessage(
        getErrorMessage(err, "Unable to update your bookmark.")
      );
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();

    if (!userId || !postId) return;

    const content = commentText.trim();

    if (content.length < 1 || content.length > 1000) {
      setCommentError("Comments must contain 1 to 1000 characters.");
      return;
    }

    setCommentSubmitting(true);
    setCommentError("");
    setCommentMessage("");

    try {
      await api.post(`/comments/${postId}`, { content });

      setCommentText("");
      setCommentMessage("Comment posted.");

      await loadComments(postId);
    } catch (err) {
      setCommentError(
        getErrorMessage(err, "Unable to post your comment.")
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  function startEditing(comment) {
    setEditingCommentId(getId(comment));
    setEditingText(comment.content || "");
    setCommentError("");
    setCommentMessage("");
  }

  async function handleUpdateComment(event, commentId) {
    event.preventDefault();

    const content = editingText.trim();

    if (content.length < 1 || content.length > 1000) {
      setCommentError("Comments must contain 1 to 1000 characters.");
      return;
    }

    setCommentSubmitting(true);
    setCommentError("");
    setCommentMessage("");

    try {
      await api.put(`/comments/${commentId}`, { content });

      setEditingCommentId(null);
      setEditingText("");
      setCommentMessage("Comment updated.");

      await loadComments(postId);
    } catch (err) {
      setCommentError(
        getErrorMessage(err, "Unable to update your comment.")
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm(
      "Delete this comment? This cannot be undone."
    );

    if (!confirmed) return;

    setCommentSubmitting(true);
    setCommentError("");
    setCommentMessage("");

    try {
      await api.delete(`/comments/${commentId}`);

      setComments((previous) =>
        previous.filter((comment) => getId(comment) !== commentId)
      );

      setCommentMessage("Comment deleted.");
    } catch (err) {
      setCommentError(
        getErrorMessage(err, "Unable to delete your comment.")
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="article-page">
        <div className="article-state">
          <span className="article-loading-orb" />
          <h2>Opening the story...</h2>
          <p>Getting the details ready.</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="article-page">
        <div className="article-state">
          <span className="article-state-icon">!</span>
          <h2>We couldn't find that story.</h2>
          <p>{error || "This article may no longer be available."}</p>
          <Link to="/" className="article-back-button">
            Back to BlogForge
          </Link>
        </div>
      </main>
    );
  }

  const tags = Array.isArray(post.tags) ? post.tags : [];
  const excerpt = post.excerpt?.trim();
  const authorName = getAuthorName(post.author);

  return (
    <main className="article-page">
      <div className="article-atmosphere" aria-hidden="true" />

      <header className="article-topbar">
        <Link to="/" className="article-brand">
          <span className="article-brand-mark">B</span>
          BlogForge
        </Link>

        <Link to="/" className="article-back-link">
          <span aria-hidden="true">←</span> All stories
        </Link>
      </header>

      <article className="article-container">
        <div className="article-heading">
          <span className="article-eyebrow">COMMUNITY STORY</span>

          <h1>{post.title}</h1>

          {excerpt && (
            <p className="article-excerpt">{excerpt}</p>
          )}

          <div className="article-meta">
            <div className="article-author-avatar">
              {authorName.charAt(0).toUpperCase()}
            </div>

            <div className="article-author-details">
              <strong>{authorName}</strong>
              <span>Community contributor</span>
            </div>

            <span className="article-meta-divider" />

            <time dateTime={post.publishedAt || post.createdAt}>
              {formatDate(post.publishedAt || post.createdAt)}
            </time>
          </div>

          {tags.length > 0 && (
            <div className="article-tags" aria-label="Article tags">
              {tags.map((tag, index) => {
                const name =
                  typeof tag === "string" ? tag : tag?.name || "";

                if (!name) return null;

                return (
                  <span
                    className="article-tag"
                    key={tag._id || name || index}
                  >
                    #{name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {post.coverImage?.url && (
          <img
            className="article-cover"
            src={post.coverImage.url}
            alt={`Cover for ${post.title}`}
          />
        )}

        <div className="article-body">
          {(post.content || "")
            .split(/\r?\n/)
            .filter((paragraph) => paragraph.trim())
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>

        <section
          className="article-engagement"
          aria-label="Article reactions"
        >
          <div>
            <h2>Enjoyed this story?</h2>
            <p>Give the author a little appreciation.</p>
          </div>

          <div className="article-engagement-actions">
            <button
              type="button"
              className={`article-like-button ${
                liked ? "is-liked" : ""
              }`}
              onClick={handleLike}
              disabled={likeLoading || !userId}
              aria-pressed={liked}
              title={!userId ? "Sign in to like this story" : "Like story"}
            >
              <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
              {likeLoading
                ? "Updating..."
                : liked
                  ? "Liked"
                  : "Like story"}
              <span className="article-like-count">{likeCount}</span>
            </button>

            <button
              type="button"
              className={`article-bookmark-button ${
                isBookmarked ? "is-bookmarked" : ""
              }`}
              onClick={handleBookmark}
              disabled={bookmarkLoading || !userId}
              aria-pressed={isBookmarked}
              title={!userId ? "Sign in to save this story" : "Save story"}
            >
              <span aria-hidden="true">
                {isBookmarked ? "▣" : "♧"}
              </span>
              {bookmarkLoading
                ? "Saving..."
                : isBookmarked
                  ? "Saved"
                  : "Save story"}
            </button>
          </div>
        </section>

        {!userId && (
          <p className="article-signin-hint">
            <Link to="/login">Sign in</Link> to like stories, save bookmarks,
            and join the discussion.
          </p>
        )}

        {bookmarkMessage && (
          <p className="article-bookmark-feedback" role="status">
            {bookmarkMessage}
            {" "}
            {isBookmarked && (
              <Link to="/bookmarks">View saved stories</Link>
            )}
          </p>
        )}

        <section
          className="article-comments"
          aria-labelledby="comments-heading"
        >
          <div className="article-comments-heading">
            <div>
              <span className="article-eyebrow">COMMUNITY</span>
              <h2 id="comments-heading">
                Discussion <span>({comments.length})</span>
              </h2>
            </div>

            <p>Keep it thoughtful. Keep it kind.</p>
          </div>

          {commentError && (
            <p
              className="article-feedback article-feedback-error"
              role="alert"
            >
              {commentError}
            </p>
          )}

          {commentMessage && (
            <p
              className="article-feedback article-feedback-success"
              role="status"
            >
              {commentMessage}
            </p>
          )}

          <form
            className="article-comment-form"
            onSubmit={handleAddComment}
          >
            <label htmlFor="article-comment-input">
              Add to the conversation
            </label>

            <textarea
              id="article-comment-input"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={
                userId
                  ? "Share a thoughtful response..."
                  : "Sign in to join the discussion..."
              }
              maxLength={1000}
              rows={4}
              disabled={!userId || commentSubmitting}
            />

            <div className="article-comment-form-footer">
              <span>{commentText.length}/1000</span>

              {userId ? (
                <button
                  type="submit"
                  className="article-primary-button"
                  disabled={
                    commentSubmitting || !commentText.trim()
                  }
                >
                  {commentSubmitting ? "Posting..." : "Post comment"}
                </button>
              ) : (
                <Link to="/login" className="article-primary-button">
                  Sign in to comment
                </Link>
              )}
            </div>
          </form>

          {commentsLoading ? (
            <p className="article-comments-empty">
              Loading discussion...
            </p>
          ) : comments.length === 0 ? (
            <div className="article-comments-empty">
              <span aria-hidden="true">✳</span>
              <h3>Start the conversation</h3>
              <p>
                There are no comments yet. Add the first thoughtful response.
              </p>
            </div>
          ) : (
            <div className="article-comment-list">
              {comments.map((comment) => {
                const commentId = getId(comment);
                const commentAuthorId = getId(comment.author);

                const isOwner =
                  Boolean(userId) &&
                  Boolean(commentAuthorId) &&
                  userId === commentAuthorId;

                const commentAuthor = getAuthorName(comment.author);
                const isEditing = editingCommentId === commentId;

                return (
                  <article
                    className="article-comment"
                    key={commentId}
                  >
                    <div className="article-comment-avatar">
                      {commentAuthor.charAt(0).toUpperCase()}
                    </div>

                    <div className="article-comment-main">
                      <div className="article-comment-meta">
                        <strong>{commentAuthor}</strong>

                        <time dateTime={comment.createdAt}>
                          {formatDate(comment.createdAt)}
                        </time>

                        {comment.isEdited && <span>Edited</span>}
                      </div>

                      {isEditing ? (
                        <form
                          className="article-comment-edit-form"
                          onSubmit={(event) =>
                            handleUpdateComment(event, commentId)
                          }
                        >
                          <textarea
                            value={editingText}
                            onChange={(event) =>
                              setEditingText(event.target.value)
                            }
                            maxLength={1000}
                            rows={3}
                            autoFocus
                          />

                          <div className="article-comment-actions">
                            <button
                              type="submit"
                              className="article-primary-button"
                              disabled={
                                commentSubmitting ||
                                !editingText.trim()
                              }
                            >
                              Save changes
                            </button>

                            <button
                              type="button"
                              className="article-secondary-button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingText("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="article-comment-content">
                          {comment.content}
                        </p>
                      )}

                      {isOwner && !isEditing && (
                        <div className="article-comment-actions">
                          <button
                            type="button"
                            className="article-text-button"
                            onClick={() => startEditing(comment)}
                            disabled={commentSubmitting}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="article-text-button article-delete-button"
                            onClick={() =>
                              handleDeleteComment(commentId)
                            }
                            disabled={commentSubmitting}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="article-footer">
          <div>
            <span className="article-footer-mark">B</span>

            <div>
              <strong>Made with BlogForge</strong>
              <p>Write. Share. Grow.</p>
            </div>
          </div>

          <Link to="/" className="article-back-button">
            Explore more stories
          </Link>
        </footer>
      </article>
    </main>
  );
}
