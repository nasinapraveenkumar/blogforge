import mongoose from "mongoose";
import Report from "./report.model.js";
import Post from "../post/post.model.js";
import { REPORT_STATUS } from "./report.constants.js";

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

export const createReport = async ({ postId, reporterId, reason }) => {
  if (!mongoose.isValidObjectId(postId)) throw fail("Invalid post ID", 400);

  const post = await Post.findOne({ _id: postId, status: "PUBLISHED" }).select("_id");
  if (!post) throw fail("Published post not found", 404);

  try {
    return await Report.create({ post: postId, reporter: reporterId, reason });
  } catch (error) {
    if (error?.code === 11000) throw fail("You have already reported this post", 409);
    throw error;
  }
};

export const getMyReports = (reporterId) =>
  Report.find({ reporter: reporterId }).populate("post", "title slug status").sort({ createdAt: -1 });

export const getPendingReports = () =>
  Report.find({ status: REPORT_STATUS.PENDING })
    .populate("post", "title slug author")
    .populate("reporter", "name email")
    .sort({ createdAt: 1 });

export const reviewReport = async ({ reportId, moderatorId, status, note }) => {
  if (!mongoose.isValidObjectId(reportId)) throw fail("Invalid report ID", 400);

  const report = await Report.findOneAndUpdate(
    { _id: reportId, status: REPORT_STATUS.PENDING },
    { $set: { status, reviewedBy: moderatorId, reviewedAt: new Date(), reviewNote: note || "" } },
    { returnDocument: "after", runValidators: true }
  )
    .populate("post", "title slug")
    .populate("reporter", "name email")
    .populate("reviewedBy", "name email");

  if (!report) throw fail("Pending report not found or already reviewed", 409);
  return report;
};
