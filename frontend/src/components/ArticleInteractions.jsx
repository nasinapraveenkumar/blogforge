
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./ArticleInteractions.css";

function getComments(payload) {
  const result =
    payload?.data?.comments ??
    payload?.data ??
    payload?.comments ??
    [];

  return Array.isArray(result) ? result : [];
}

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    fallback
  );
}

function ArticleInteractions({
  postId,
  initialLikeCount = 0,
  initialLiked = false,
}) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likeCount, setLikeCount] = useState(
    Number(initialLikeCount) || 0
  );
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setLiked(Boolean(initialLiked));
    setLikeCount(Number(initialLikeCount) || 0);
  }, [initialLiked, initialLikeCount]);

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setLoadingComments(true);
      setError("");

      try {
        const response = await api.get(`/comments/${postId}`);

        if (active) {
          setComments(getComments(response.data));
        }
      } catch (err) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load comments.")
          );
        }
      } finally {
        if (active) {
          setLoadingComments(false);
        }
      }
    }

    if (postId) {
      loadComments();
    } else {
      setLoadingComments(false);
      setError("This article does not have a valid post ID.");
    }

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleLike() {
    if (liking) return;

    setLiking(true);
    setError("");
    setNotice("");

    try {
      if (liked) {
        await api.delete(`/likes/${postId}`);
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        await api.post(`/likes/${postId}`);
        setLiked(true);
        setLikeCount((count) => count + 1);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update your like. Sign in if required."
        )
      );
    } finally {
      setLiking(false);
    }
  }

  async function handleSubmitComment(event) {
    event.preventDefault();

    const content = commentText.trim();

    if (content.length < 1) {
      setError("Write a comment before submitting.");
      return;
    }

    if (content.length > 1000) {
      setError("Comments cannot exceed 1000 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await api.post(`/comments/${postId}`, { content });

      const response = await api.get(`/comments/${postId}`);
      setComments(getComments(response.data));
      setCommentText("");
      setNotice("Your comment was posted.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to post your comment. Sign in if required."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(commentId) {
    const content = editText.trim();

    if (!content || content.length > 1000) {
      setError("Enter a comment between 1 and 1000 characters.");
      return;
    }

    setError("");
    setNotice("");

    try {
      await api.put(`/comments/${commentId}`, { content });

      const response = await api.get(`/comments/${postId}`);
      setComments(getComments(response.data));
      setEditingId(null);
      setEditText("");
      setNotice("Your comment was updated.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to update this comment.")
      );
    }
  }

  async function handleDeleteComment(commentId) {
    const confirmed = window.confirm(
      "Delete this comment? This action cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/comments/${commentId}`);
      setComments((current) =>
        current.filter((comment) => comment._id !== commentId)
      );
      setNotice("Comment deleted.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete this comment.")
      );
    }
  }

  return (
    <section className="bf-interactions">
      <div className="bf-interactions-like-row">
        <button
          type="button"
          className={`bf-like-button ${liked ? "is-liked" : ""}`}
          onClick={handleLike}
          disabled={liking}
          aria-pressed={liked}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          {liking ? "Updating..." : liked ? "Liked" : "Like"}
          <span className="bf-like-count">{likeCount}</span>
        </button>
        <span className="bf-interactions-muted">
          Show appreciation for this article
        </span>
      </div>

      <div className="bf-comments-heading">
        <h2>Comments</h2>
        <span>{comments.length}</span>
      </div>

      <form
        className="bf-comment-form"
        onSubmit={handleSubmitComment}
      >
        <label htmlFor="bf-comment-input">Join the discussion</label>
        <textarea
          id="bf-comment-input"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Share a useful thought..."
          maxLength={1000}
          rows={4}
          required
        />

        <div className="bf-comment-form-footer">
          <span>{commentText.length}/1000</span>
          <button type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>

      {error && (
        <p className="bf-interaction-message is-error" role="alert">
          {error}
          {error.toLowerCase().includes("sign in") && (
            <>
              {" "}
              <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      )}

      {notice && (
        <p className="bf-interaction-message" role="status">
          {notice}
        </p>
      )}

      <div className="bf-comment-list">
        {loadingComments ? (
          <p className="bf-interactions-muted">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <div className="bf-comments-empty">
            <h3>Start the conversation</h3>
            <p>Be the first to share a thoughtful comment.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const author = comment.author || {};
            const authorName =
              author.name || author.username || "BlogForge member";
            const commentId = comment._id;

            return (
              <article
                className="bf-comment"
                key={commentId}
              >
                <div className="bf-comment-avatar">
                  {authorName.charAt(0).toUpperCase()}
                </div>

                <div className="bf-comment-body">
                  <div className="bf-comment-meta">
                    <strong>{authorName}</strong>
                    <time>
                      {comment.createdAt
                        ? new Date(
                            comment.createdAt
                          ).toLocaleDateString()
                        : ""}
                    </time>
                    {comment.isEdited && (
                      <span className="bf-comment-edited">
                        Edited
                      </span>
                    )}
                  </div>

                  {editingId === commentId ? (
                    <div className="bf-comment-edit">
                      <textarea
                        value={editText}
                        onChange={(event) =>
                          setEditText(event.target.value)
                        }
                        maxLength={1000}
                        rows={3}
                      />
                      <div className="bf-comment-actions">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(commentId)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="is-secondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="bf-comment-content">
                      {comment.content}
                    </p>
                  )}

                  {author._id === comment.currentUserId && null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ArticleInteractions;
