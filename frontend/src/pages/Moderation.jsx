
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Moderation.css";

function getErrorMessage(error) {
  if (error.response?.status === 403) {
    return "Access denied. Sign in with a MODERATOR or ADMIN account.";
  }

  return (
    error.response?.data?.message ||
    "Something went wrong. Please try again."
  );
}

function getPostId(post) {
  return post?._id || post?.id;
}

function getTagName(tag) {
  if (typeof tag === "string") return tag;
  return tag?.name || "";
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Moderation() {
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [history, setHistory] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadHistory = useCallback(async (postId) => {
    try {
      const response = await api.get(
        `/moderation/posts/${postId}/history`
      );

      const data = response.data?.data;

      setHistory(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.history)
            ? data.history
            : []
      );
    } catch {
      // History is supplementary. A history failure should not
      // prevent the moderator from reviewing the article.
      setHistory([]);
    }
  }, []);

  const claimNextPost = useCallback(async () => {
    if (loading || actionLoading) return;

    setLoading(true);
    setError("");
    setNotice("");
    setPost(null);
    setHistory([]);
    setShowRejectForm(false);
    setRejectionReason("");

    try {
      const response = await api.post(
        "/moderation/queue/claim-next"
      );

      const data = response.data?.data;
      const claimedPost = data?.post || data;

      if (
        !claimedPost ||
        typeof claimedPost !== "object" ||
        !getPostId(claimedPost)
      ) {
        setNotice(
          response.data?.message ||
            "No submissions are currently available for review."
        );
        return;
      }

      setPost(claimedPost);
      await loadHistory(getPostId(claimedPost));
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [actionLoading, loadHistory, loading, navigate]);

  useEffect(() => {
    claimNextPost();
  }, []);

  const handleApprove = async () => {
    if (!post || actionLoading) return;

    const postId = getPostId(post);

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/moderation/posts/${postId}/approve`
      );

      setNotice(
        response.data?.message || "Post approved successfully."
      );
      setPost(null);
      setHistory([]);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();

    if (!post || actionLoading) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setError("Please provide a reason for rejecting this post.");
      return;
    }

    if (reason.length > 1000) {
      setError("The rejection reason cannot exceed 1000 characters.");
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/moderation/posts/${getPostId(post)}/reject`,
        { reason }
      );

      setNotice(
        response.data?.message || "Post rejected successfully."
      );
      setPost(null);
      setHistory([]);
      setShowRejectForm(false);
      setRejectionReason("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading(false);
    }
  };

  const author =
    post?.author?.name ||
    post?.author?.username ||
    post?.authorName ||
    "BlogForge member";

  const content = post?.content || post?.body || "";

  return (
    <main className="moderation-page">
      <header className="moderation-topbar">
        <Link to="/dashboard" className="moderation-brand">
          <span className="moderation-brand-mark">B</span>
          <span>BlogForge</span>
        </Link>

        <Link to="/dashboard" className="moderation-back">
          Back to dashboard
        </Link>
      </header>

      <section className="moderation-shell">
        <div className="moderation-heading">
          <div>
            <span className="moderation-eyebrow">
              TRUST &amp; SAFETY
            </span>
            <h1>Content moderation</h1>
            <p>
              Review submissions carefully and help keep the
              BlogForge community useful, respectful, and trustworthy.
            </p>
          </div>

          <div className="moderation-status-pill">
            <span className="moderation-status-dot" />
            Moderator workspace
          </div>
        </div>

        {error && (
          <div
            className="moderation-alert moderation-alert-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            className="moderation-alert moderation-alert-success"
            role="status"
          >
            {notice}
          </div>
        )}

        <div className="moderation-workspace">
          <section className="moderation-review-card">
            <div className="moderation-card-heading">
              <div>
                <span className="moderation-eyebrow">
                  REVIEW QUEUE
                </span>
                <h2>Submission review</h2>
              </div>

              <span className="moderation-review-icon">✳</span>
            </div>

            {loading ? (
              <div className="moderation-empty" aria-live="polite">
                <span className="moderation-spinner" />
                <h3>Finding the next submission</h3>
                <p>Loading the moderation queue...</p>
              </div>
            ) : post ? (
              <>
                <div className="moderation-post-meta">
                  <span className="moderation-tag">
                    {(post.status || "UNDER_REVIEW")
                      .replaceAll("_", " ")}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>

                <h3 className="moderation-post-title">
                  {post.title || "Untitled submission"}
                </h3>

                <p className="moderation-author">
                  Submitted by <strong>{author}</strong>
                </p>

                {post.excerpt && (
                  <p className="moderation-excerpt">
                    {post.excerpt}
                  </p>
                )}

                <article className="moderation-article">
                  {content || "No article content was returned."}
                </article>

                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="moderation-tags">
                    {post.tags.map((tag, index) => {
                      const name = getTagName(tag);

                      return name ? (
                        <span key={tag?._id || `${name}-${index}`}>
                          #{name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {!showRejectForm ? (
                  <div className="moderation-actions">
                    <button
                      type="button"
                      className="moderation-button moderation-button-approve"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? "Processing..."
                        : "Approve post"}
                    </button>

                    <button
                      type="button"
                      className="moderation-button moderation-button-reject"
                      onClick={() => {
                        setError("");
                        setShowRejectForm(true);
                      }}
                      disabled={actionLoading}
                    >
                      Reject post
                    </button>
                  </div>
                ) : (
                  <form
                    className="moderation-reject-form"
                    onSubmit={handleReject}
                  >
                    <label htmlFor="rejection-reason">
                      Reason for rejection
                    </label>

                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(event) =>
                        setRejectionReason(event.target.value)
                      }
                      placeholder="Explain what needs to change..."
                      rows={4}
                      maxLength={1000}
                      required
                      disabled={actionLoading}
                    />

                    <div className="moderation-actions">
                      <button
                        type="submit"
                        className="moderation-button moderation-button-reject"
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? "Processing..."
                          : "Confirm rejection"}
                      </button>

                      <button
                        type="button"
                        className="moderation-button moderation-button-secondary"
                        onClick={() => {
                          setShowRejectForm(false);
                          setError("");
                        }}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="moderation-empty">
                <span className="moderation-empty-icon">✓</span>
                <h3>No active submission</h3>
                <p>
                  There is no article currently loaded for review.
                  Claim the next submission to continue.
                </p>

                <button
                  type="button"
                  className="moderation-button moderation-button-approve"
                  onClick={claimNextPost}
                  disabled={loading || actionLoading}
                >
                  Check next submission
                </button>
              </div>
            )}
          </section>

          <aside className="moderation-side-column">
            <section className="moderation-info-card">
              <span className="moderation-eyebrow">
                REVIEW PRINCIPLES
              </span>
              <h2>What to look for</h2>

              <ul className="moderation-checklist">
                <li>
                  <span>01</span>
                  <div>
                    <strong>Originality</strong>
                    <p>
                      Look for copied content or misleading attribution.
                    </p>
                  </div>
                </li>

                <li>
                  <span>02</span>
                  <div>
                    <strong>Community safety</strong>
                    <p>
                      Check for harassment, abuse, or harmful material.
                    </p>
                  </div>
                </li>

                <li>
                  <span>03</span>
                  <div>
                    <strong>Content quality</strong>
                    <p>
                      Check relevance, clarity, and misleading claims.
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="moderation-info-card">
              <span className="moderation-eyebrow">AUDIT TRAIL</span>
              <h2>Recent review history</h2>

              {history.length === 0 ? (
                <p className="moderation-history-empty">
                  No review history available for this submission.
                </p>
              ) : (
                <ul className="moderation-history-list">
                  {history.map((item, index) => (
                    <li key={item._id || item.id || index}>
                      <span className="moderation-history-dot" />
                      <div>
                        <strong>
                          {item.action ||
                            item.status ||
                            item.event ||
                            "Review event"}
                        </strong>

                        <p>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "Time unavailable"}
                        </p>

                        {item.reason && <p>{item.reason}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
