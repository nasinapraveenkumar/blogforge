import mongoose from "mongoose";
import { REPORT_STATUS } from "./report.constants.js";

const reportSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
  status: { type: String, enum: Object.values(REPORT_STATUS), default: REPORT_STATUS.PENDING, index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
}, { timestamps: true });

reportSchema.index({ post: 1, reporter: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;
