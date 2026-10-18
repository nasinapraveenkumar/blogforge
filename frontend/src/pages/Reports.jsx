
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Reports.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/reports/moderation/pending");
      const data = response.data?.data;

      setReports(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.reports)
            ? data.reports
            : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Moderator access may be required."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function reviewReport(reportId, status) {
    try {
      setBusyId(reportId);
      setError("");

      await api.patch(`/reports/${reportId}/review`, {
        status,
        note: notes[reportId] || "",
      });

      setReports((current) =>
        current.filter(
          (report) => String(report._id) !== String(reportId)
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to review this report."
      );
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <main className="bf-reports">
        <p>Loading reports...</p>
      </main>
    );
  }

  return (
    <main className="bf-reports">
      <header className="bf-reports-header">
        <div>
          <span className="bf-reports-eyebrow">
            MODERATION CENTER
          </span>
          <h1>Reported content</h1>
          <p>
            Review community reports and record your decision.
          </p>
        </div>

        <button
          className="bf-reports-refresh"
          type="button"
          onClick={loadReports}
          disabled={Boolean(busyId)}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="bf-reports-error" role="alert">
          {error}
        </div>
      )}

      <section className="bf-reports-list">
        {reports.length === 0 ? (
          <div className="bf-reports-empty">
            <h2>No pending reports</h2>
            <p>There are no reports waiting for review.</p>
          </div>
        ) : (
          reports.map((report) => {
            const post =
              report.post && typeof report.post === "object"
                ? report.post
                : null;

            const reporter =
              report.reporter &&
              typeof report.reporter === "object"
                ? report.reporter
                : null;

            return (
              <article
                className="bf-report-card"
                key={report._id}
              >
                <div className="bf-report-card-header">
                  <span className="bf-report-status">
                    {report.status || "PENDING"}
                  </span>
                  <span className="bf-report-id">
                    Report #{String(report._id).slice(-6)}
                  </span>
                </div>

                <h2>
                  {post?.title || "Post unavailable"}
                </h2>

                {post?.slug && (
                  <p className="bf-report-slug">
                    Article slug: {post.slug}
                  </p>
                )}

                <div className="bf-report-meta">
                  <span>
                    Reporter: {reporter?.name || "Unknown"}
                  </span>
                  {reporter?.email && (
                    <span>{reporter.email}</span>
                  )}
                </div>

                <div className="bf-report-reason">
                  <strong>Reason for report</strong>
                  <p>{report.reason || "No reason provided."}</p>
                </div>

                <label
                  className="bf-report-note-label"
                  htmlFor={`note-${report._id}`}
                >
                  Moderator note
                </label>

                <textarea
                  id={`note-${report._id}`}
                  value={notes[report._id] || ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [report._id]: event.target.value,
                    }))
                  }
                  maxLength={1000}
                  rows={3}
                  placeholder="Record the reason for your decision..."
                />

                <div className="bf-report-actions">
                  <button
                    type="button"
                    className="bf-report-dismiss"
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      reviewReport(report._id, "DISMISSED")
                    }
                  >
                    {busyId === report._id
                      ? "Saving..."
                      : "Dismiss report"}
                  </button>

                  <button
                    type="button"
                    className="bf-report-action"
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      reviewReport(report._id, "ACTION_TAKEN")
                    }
                  >
                    {busyId === report._id
                      ? "Saving..."
                      : "Mark action taken"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

export default Reports;
