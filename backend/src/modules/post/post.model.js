
import mongoose from "mongoose";
import { POST_STATUS } from "./post.constants.js";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    content: {
      type: String,
      required: true,
      minlength: 50,
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.DRAFT,
      index: true,
    },

   
    moderation: {
      moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      claimedAt: {
        type: Date,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      action: {
        type: String,
        enum: ["APPROVE", "REJECT", "REMOVE"],
        default: null,
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },


    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    coverImage: {
      url: {
        type: String,
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },

    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
