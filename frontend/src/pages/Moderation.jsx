
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

function getId(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || value.id || "";
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

function formatDateTime(date) {
  if (!date) return "Time unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Time unavailable";
  }

  return parsedDate.toLocaleString("en-IN");
}

export default function Moderation() {
  const navigate = useNavigate();

  // Post moderation state
  const [post, setPost] = useState(null);
  const [history, setHistory] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // User report state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportReviewingId, setReportReviewingId] = useState(null);
  const [reportNotes, setReportNotes] = useState({});
  const [reportError, setReportError] = useState("");
  const [reportNotice, setReportNotice] = useState("");

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
      // History is supplementary. Keep the review workflow usable.
      setHistory([]);
    }
  }, []);

  const loadPendingReports = useCallback(async () => {
    setReportsLoading(true);
    setReportError("");

    try {
      const response = await api.get("/reports/moderation/pending");
      const data = response.data?.data;

      setReports(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setReportError(getErrorMessage(requestError));
    } finally {
      setReportsLoading(false);
    }
  }, [navigate]);

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
        !getId(claimedPost)
      ) {
        setNotice(
          response.data?.message ||
            "No submissions are currently available for review."
        );
        return;
      }

      setPost(claimedPost);
      await loadHistory(getId(claimedPost));
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
    loadPendingReports();
    // Initial page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async () => {
    if (!post || actionLoading) return;

    const postId = getId(post);

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
        `/moderation/posts/${getId(post)}/reject`,
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

  const handleReportReview = async (reportId, status) => {
    if (!reportId || reportReviewingId) return;

    const note = (reportNotes[reportId] || "").trim();

    if (note.length > 1000) {
      setReportError("The review note cannot exceed 1000 characters.");
      return;
    }

    setReportReviewingId(reportId);
    setReportError("");
    setReportNotice("");

    try {
      const response = await api.patch(
        `/reports/${reportId}/review`,
        { status, note }
      );

      setReports((previous) =>
        previous.filter((report) => getId(report) !== reportId)
      );

      setReportNotes((previous) => {
        const next = { ...previous };
        delete next[reportId];
        return next;
      });

      setReportNotice(
        response.data?.message || "Report reviewed successfully."
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setReportError(getErrorMessage(requestError));
    } finally {
      setReportReviewingId(null);
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
              Review submissions and community reports to keep
              BlogForge useful, respectful, and trustworthy.
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

        {/* POST SUBMISSION REVIEW */}
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
                    {(post.status || "UNDER_REVIEW").replaceAll("_", " ")}
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
                  <p className="moderation-excerpt">{post.excerpt}</p>
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
                      {actionLoading ? "Processing..." : "Approve post"}
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
                    <p>Look for copied content or misleading attribution.</p>
                  </div>
                </li>

                <li>
                  <span>02</span>
                  <div>
                    <strong>Community safety</strong>
                    <p>Check for harassment, abuse, or harmful material.</p>
                  </div>
                </li>

                <li>
                  <span>03</span>
                  <div>
                    <strong>Content quality</strong>
                    <p>Check relevance, clarity, and misleading claims.</p>
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

                        <p>{formatDateTime(item.createdAt)}</p>

                        {item.reason && <p>{item.reason}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>

        {/* USER REPORT REVIEW */}
        <section
          className="moderation-reports-section"
          aria-labelledby="moderation-reports-heading"
        >
          <div className="moderation-reports-header">
            <div>
              <span className="moderation-eyebrow">COMMUNITY SAFETY</span>
              <h2 id="moderation-reports-heading">
                Pending user reports ({reports.length})
              </h2>
              <p>
                Review reported posts and record a decision. Reviewing a
                report does not automatically remove the reported post.
              </p>
            </div>

            <button
              type="button"
              className="moderation-button moderation-button-secondary"
              onClick={loadPendingReports}
              disabled={reportsLoading || Boolean(reportReviewingId)}
            >
              {reportsLoading ? "Refreshing..." : "Refresh reports"}
            </button>
          </div>

          {reportError && (
            <div
              className="moderation-alert moderation-alert-error"
              role="alert"
            >
              {reportError}
            </div>
          )}

          {reportNotice && (
            <div
              className="moderation-alert moderation-alert-success"
              role="status"
            >
              {reportNotice}
            </div>
          )}

          {reportsLoading ? (
            <div className="moderation-empty" aria-live="polite">
              <span className="moderation-spinner" />
              <h3>Loading reports</h3>
              <p>Fetching reports that need review...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="moderation-empty">
              <span className="moderation-empty-icon">✓</span>
              <h3>No pending reports</h3>
              <p>
                There are no reports waiting for review right now.
              </p>
            </div>
          ) : (
            <div className="moderation-report-list">
              {reports.map((report) => {
                const reportId = getId(report);
                const reportedPost = report.post;
                const reporter = report.reporter;

                const postTitle =
                  reportedPost?.title || "Reported post unavailable";

                const slug = reportedPost?.slug;
                const reporterName =
                  reporter?.name ||
                  reporter?.username ||
                  "Community member";

                const isReviewing = reportReviewingId === reportId;

                return (
                  <article
                    className="moderation-report-card"
                    key={reportId}
                  >
                    <div className="moderation-report-card-top">
                      <span className="moderation-tag">PENDING</span>
                      <time dateTime={report.createdAt || ""}>
                        Reported {formatDate(report.createdAt)}
                      </time>
                    </div>

                    <h3>{postTitle}</h3>

                    <p className="moderation-report-reporter">
                      Reported by <strong>{reporterName}</strong>
                    </p>

                    <div className="moderation-report-reason">
                      <strong>Reason for report</strong>
                      <p>{report.reason || "No reason provided."}</p>
                    </div>

                    {slug && (
                      <p className="moderation-report-link">
                        <Link to={`/posts/${encodeURIComponent(slug)}`}>
                          View reported article
                        </Link>
                      </p>
                    )}

                    {!reportedPost && (
                      <p className="moderation-report-reporter">
                        The post details are unavailable. Review the report
                        carefully before deciding.
                      </p>
                    )}

                    <label
                      className="moderation-report-note-label"
                      htmlFor={`report-note-${reportId}`}
                    >
                      Review note (optional)
                    </label>

                    <textarea
                      id={`report-note-${reportId}`}
                      className="moderation-report-note"
                      value={reportNotes[reportId] || ""}
                      onChange={(event) =>
                        setReportNotes((previous) => ({
                          ...previous,
                          [reportId]: event.target.value,
                        }))
                      }
                      placeholder="Record why you took this decision..."
                      rows={3}
                      maxLength={1000}
                      disabled={Boolean(reportReviewingId)}
                    />

                    <div className="moderation-actions">
                      <button
                        type="button"
                        className="moderation-button moderation-button-approve"
                        onClick={() =>
                          handleReportReview(reportId, "ACTION_TAKEN")
                        }
                        disabled={Boolean(reportReviewingId)}
                      >
                        {isReviewing
                          ? "Processing..."
                          : "Action taken"}
                      </button>

                      <button
                        type="button"
                        className="moderation-button moderation-button-secondary"
                        onClick={() =>
                          handleReportReview(reportId, "DISMISSED")
                        }
                        disabled={Boolean(reportReviewingId)}
                      >
                        {isReviewing ? "Processing..." : "Dismiss report"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
