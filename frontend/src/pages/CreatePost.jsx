
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
  };

  const submitPost = async (event, submitForReview = false) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!form.content.trim()) {
      setError("Please write some content before saving.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // Save as a draft first.
      const response = await api.post("/posts", payload);

      const post = response.data?.data?.post ?? response.data?.data;

      // Submit the saved post for moderation when requested.
      if (submitForReview) {
        const postId = post?._id || post?.id;

        if (!postId) {
          setSuccess("Post saved. Open My Posts to check its status.");
          return;
        }

        await api.patch(`/posts/${postId}/submit`);

        setSuccess("Your post has been submitted for review!");
      } else {
        setSuccess("Draft saved successfully!");
      }

      setTimeout(() => navigate("/my-posts"), 900);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to save your post. Please check the backend API."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="create-post-page">
      <div className="create-post-shell">
        <header className="create-post-header">
          <button
            type="button"
            className="create-post-back"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <span className="create-post-eyebrow">
            BLOGFORGE / EDITOR
          </span>

          <h1>Create something <span>worth reading.</span></h1>

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
            <div className="create-post-message error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="create-post-message success-message">
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
              maxLength={180}
              required
            />
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
            />
            <span className="create-post-hint">
              {form.content.trim()
                ? `${form.content.trim().split(/\s+/).length} words`
                : "Write clearly. Make every paragraph count."}
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
            />
            <span className="create-post-hint">
              Separate tags with commas.
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
