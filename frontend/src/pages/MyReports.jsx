
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./MyReports.css";

function extractReports(payload) {
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(payload?.reports)) return payload.reports;

  return [];
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatus(status) {
  const normalized = String(status || "PENDING").toUpperCase();

  if (normalized === "ACTION_TAKEN") {
    return { label: "Action taken", className: "action-taken" };
  }

  if (normalized === "DISMISSED") {
    return { label: "Dismissed", className: "dismissed" };
  }

  return { label: "Pending review", className: "pending" };
}

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/reports/mine");
      setReports(extractReports(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your report history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <main className="bf-my-reports">
      <header className="bf-my-reports-header">
        <div>
          <span className="bf-my-reports-eyebrow">TRUST & SAFETY</span>
          <h1>My reports</h1>
          <p>
            Track the reports you've submitted to help keep BlogForge
            useful and respectful.
          </p>
        </div>

        <Link to="/explore" className="bf-my-reports-back">
          Explore articles
        </Link>
      </header>

      {error && (
        <div className="bf-my-reports-alert" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadReports}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="bf-my-reports-empty">Loading report history...</div>
      ) : !error && reports.length === 0 ? (
        <div className="bf-my-reports-empty">
          <h2>No reports submitted</h2>
          <p>
            Reports you submit on articles will appear here so you can
            keep track of their review status.
          </p>
          <Link to="/explore">Browse articles</Link>
        </div>
      ) : (
        <section className="bf-my-reports-list">
          {reports.map((report) => {
            const status = getStatus(report.status);
            const post = report.post || {};
            const postTitle =
              post.title || report.postTitle || "Article unavailable";
            const slug = post.slug;

            return (
              <article
                className="bf-my-report-card"
                key={report._id || report.id}
              >
                <div className="bf-my-report-main">
                  <div className="bf-my-report-title-row">
                    <h2>{postTitle}</h2>
                    <span
                      className={`bf-my-report-status ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="bf-my-report-reason">
                    <strong>Your reason:</strong>{" "}
                    {report.reason || "No reason provided"}
                  </p>

                  <div className="bf-my-report-meta">
                    <span>
                      Submitted {formatDate(report.createdAt)}
                    </span>
                    {report.reviewedAt && (
                      <span>
                        Reviewed {formatDate(report.reviewedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {slug && (
                  <Link
                    to={`/posts/${encodeURIComponent(slug)}`}
                    className="bf-my-report-link"
                  >
                    View article
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
