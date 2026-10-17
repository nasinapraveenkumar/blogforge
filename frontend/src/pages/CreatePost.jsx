
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const submitPost = async (event, submitForReview = false) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const content = form.content.trim();
    const excerpt = form.excerpt.trim();

    if (title.length < 5) {
      setError("Your title must contain at least 5 characters.");
      return;
    }

    if (title.length > 150) {
      setError("Your title cannot exceed 150 characters.");
      return;
    }

    if (content.length < 50) {
      setError("Your article must contain at least 50 characters.");
      return;
    }

    if (excerpt.length > 300) {
      setError("Your introduction cannot exceed 300 characters.");
      return;
    }

    const tags = [
      ...new Set(
        form.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    if (tags.length > 10) {
      setError("You can add a maximum of 10 tags.");
      return;
    }

    if (tags.some((tag) => tag.length > 30)) {
      setError("Each tag must contain at most 30 characters.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title,
        content,
        excerpt,
        tags,
      };

      // Create the post using the existing backend endpoint.
      const response = await api.post("/posts", payload);
      const post = response.data?.data?.post ?? response.data?.data;
      const postId = post?._id || post?.id;

      if (!postId) {
        setSuccess("Post saved. Check My Posts for its current status.");
        return;
      }

      if (submitForReview) {
        try {
          // Submit the saved draft for moderator review.
          await api.patch(`/posts/${postId}/submit`);

          setSuccess("Your post has been submitted for review!");
        } catch (submitError) {
          const message = submitError.response?.data?.message;

          setError(
            `Your post was saved, but submission failed. ${
              message || "Check My Posts before trying again."
            }`
          );
          return;
        }
      } else {
        setSuccess("Draft saved successfully!");
      }

      navigate("/my-posts", { state: { message: success } });
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        navigate("/login");
        return;
      }

      if (status === 400 || status === 422) {
        setError(
          err.response?.data?.message ||
            "Please check your title, article content, and tags."
        );
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to save your post. Check that the backend is running."
      );
    } finally {
      setSaving(false);
    }
  };

  const wordCount = form.content.trim()
    ? form.content.trim().split(/\s+/).length
    : 0;

  return (
    <main className="create-post-page">
      <div className="create-post-shell">
        <header className="create-post-header">
          <button
            type="button"
            className="create-post-back"
            onClick={() => navigate("/dashboard")}
            disabled={saving}
          >
            ← Dashboard
          </button>

          <span className="create-post-eyebrow">
            BLOGFORGE / EDITOR
          </span>

          <h1>
            Create something <span>worth reading.</span>
          </h1>

          <p>
            Turn your ideas into a post. Save a draft or send it to
            moderation when you are ready.
          </p>
        </header>

        <form
          className="create-post-form glass-panel"
          onSubmit={(event) => submitPost(event, false)}
        >
          {error && (
            <div
              className="create-post-message error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="create-post-message success-message"
              role="status"
            >
              {success}
            </div>
          )}

          <div className="create-post-field">
            <label htmlFor="title">Post title</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="Give your idea a strong headline"
              minLength={5}
              maxLength={150}
              required
              disabled={saving}
            />
            <span className="create-post-hint">
              {form.title.trim().length}/150 characters
            </span>
          </div>

          <div className="create-post-field">
            <label htmlFor="excerpt">Short introduction</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={updateField}
              placeholder="What will readers learn from this post?"
              rows={3}
              maxLength={300}
              disabled={saving}
            />
            <span className="create-post-hint">
              {form.excerpt.length}/300 characters
            </span>
          </div>

          <div className="create-post-field">
            <label htmlFor="content">Your story</label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={updateField}
              placeholder="Start writing your post here..."
              rows={15}
              required
              disabled={saving}
              aria-describedby="content-hint"
            />
            <span
              id="content-hint"
              className="create-post-hint"
            >
              {wordCount} words · {form.content.trim().length}/50 minimum characters
            </span>
          </div>

          <div className="create-post-field">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              name="tags"
              value={form.tags}
              onChange={updateField}
              placeholder="JavaScript, Web Development, Career"
              disabled={saving}
            />
            <span className="create-post-hint">
              Separate tags with commas. Maximum 10 tags.
            </span>
          </div>

          <div className="create-post-footer">
            <span className="create-post-footer-note">
              Your work belongs to you. Review it before publishing.
            </span>

            <div className="create-post-actions">
              <button
                type="button"
                className="create-post-secondary"
                disabled={saving}
                onClick={(event) => submitPost(event, false)}
              >
                {saving ? "Saving..." : "Save draft"}
              </button>

              <button
                type="button"
                className="create-post-primary"
                disabled={saving}
                onClick={(event) => submitPost(event, true)}
              >
                {saving ? "Processing..." : "Submit for review →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
