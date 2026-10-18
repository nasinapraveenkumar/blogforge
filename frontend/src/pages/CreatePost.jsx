import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CreatePost.css";

function CreatePost() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: "",
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadPost() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/posts/mine");
        const result = response.data?.data;
        const posts = Array.isArray(result)
          ? result
          : result?.posts || [];

        const post = posts.find(
          (item) => String(item._id || item.id) === String(id)
        );

        if (!post) {
          throw new Error(
            "Article not found in your posts. You may not own this article."
          );
        }

        if (post.status !== "DRAFT") {
          throw new Error("Only draft articles can be edited.");
        }

        if (active) {
          setForm({
            title: post.title || "",
            excerpt: post.excerpt || "",
            content: post.content || "",
            tags: Array.isArray(post.tags)
              ? post.tags
                  .map((tag) =>
                    typeof tag === "string" ? tag : tag.name || ""
                  )
                  .filter(Boolean)
                  .join(", ")
              : "",
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load article."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function getPayload() {
    return {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }

  function validateForm() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Please enter an article title and content.");
      return false;
    }

    return true;
  }

  async function handleSaveDraft(event) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (isEditing) {
        await api.patch(`/posts/${id}`, getPayload());
      } else {
        const response = await api.post("/posts", {
          ...getPayload(),
          status: "DRAFT",
        });

        const result = response.data?.data;
        const post = result?.post ?? result;
        const postId = post?._id || post?.id;

        if (!postId) {
          throw new Error("The server did not return the new article ID.");
        }

        setSuccess("Draft saved successfully.");
        navigate(`/edit-post/${postId}`, { replace: true });
        return;
      }

      setSuccess("Draft saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save your draft. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (isEditing) {
        // Save the latest changes before submitting the existing draft.
        await api.patch(`/posts/${id}`, getPayload());
        await api.patch(`/posts/${id}/submit`);
      } else {
        // Create the post directly for moderation. No draft step required.
        await api.post("/posts", {
          ...getPayload(),
          status: "PENDING",
        });
      }

      setSuccess("Your article has been submitted for moderation.");

      setTimeout(() => {
        navigate("/my-posts");
      }, 900);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to submit your article for review."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="create-post-page">
        <div className="create-post-shell">
          <p>Loading your article...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="create-post-page">
      <div className="create-post-shell">
        <header className="create-post-header">
          <button
            type="button"
            className="create-post-back"
            onClick={() => navigate("/my-posts")}
          >
            &larr; Back to my posts
          </button>

          <span className="create-post-eyebrow">BLOGFORGE EDITOR</span>

          <h1>
            {isEditing ? (
              <>
                Refine your <span>story.</span>
              </>
            ) : (
              <>
                Create something <span>meaningful.</span>
              </>
            )}
          </h1>

          <p>
            Every great article starts with an idea. Write your story,
            save it for later, or submit it directly for moderation.
          </p>
        </header>

        {error && (
          <div className="create-post-message error-message" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="create-post-message success-message" role="status">
            {success}
          </div>
        )}

        <form className="create-post-form" onSubmit={handleSaveDraft}>
          <div className="create-post-field">
            <label htmlFor="title">Article title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Give your story a compelling title"
              maxLength={200}
              required
            />
          </div>

          <div className="create-post-field">
            <label htmlFor="excerpt">Short description</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              placeholder="What will readers discover in this article?"
              rows={3}
              maxLength={500}
            />
            <span className="create-post-hint">
              Give readers a quick preview of your article.
            </span>
          </div>

          <div className="create-post-field">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={form.tags}
              onChange={handleChange}
              placeholder="javascript, react, web development"
            />
            <span className="create-post-hint">
              Separate each tag with a comma.
            </span>
          </div>

          <div className="create-post-field">
            <label htmlFor="content">Article content</label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Start writing your story here..."
              rows={14}
              required
            />
            <span className="create-post-hint">
              Write clearly, share what you learned, and help other developers grow.
            </span>
          </div>

          <footer className="create-post-footer">
            <p className="create-post-footer-note">
              Save your work privately to edit it later, or submit it directly
              for moderation. Saving a draft is optional.
            </p>

            <div className="create-post-actions">
              <button
                type="submit"
                className="create-post-secondary"
                disabled={saving}
              >
                {saving ? "Please wait..." : "Save draft"}
              </button>

              <button
                type="button"
                className="create-post-primary"
                onClick={handleSubmitForReview}
                disabled={saving}
                title="Submit your post directly for moderation"
              >
                {saving ? "Please wait..." : "Submit for review"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}

export default CreatePost;
