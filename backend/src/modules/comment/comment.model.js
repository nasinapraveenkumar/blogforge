import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Improve query performance when loading a post's comments.
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
