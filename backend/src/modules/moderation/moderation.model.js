import mongoose from "mongoose";
import {
  MODERATION_ACTION,
  MODERATION_STATUS,
} from "./moderation.constants.js";

const moderationSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(MODERATION_ACTION),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(MODERATION_STATUS),
      default: MODERATION_STATUS.PENDING,
      index: true,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Moderation = mongoose.model("Moderation", moderationSchema);

export default Moderation;