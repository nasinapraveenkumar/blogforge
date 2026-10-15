import { createReport, getMyReports, getPendingReports, reviewReport } from "./report.service.js";
import { createReportSchema, reviewReportSchema } from "./report.validation.js";

const sendError = (res, error, fallback) => {
  const status = error.statusCode || (error.name === "ZodError" ? 400 : 500);
  if (status >= 500) console.error(error);
  return res.status(status).json({
    success: false,
    message: status >= 500 ? fallback : error.message,
  });
};

export const create = async (req, res) => {
  try {
    const { reason } = createReportSchema.parse(req.body);
    const report = await createReport({ postId: req.params.postId, reporterId: req.user._id, reason });
    return res.status(201).json({ success: true, message: "Report submitted successfully", data: report });
  } catch (error) {
    return sendError(res, error, "Failed to submit report");
  }
};

export const getMine = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await getMyReports(req.user._id) });
  } catch (error) {
    return sendError(res, error, "Failed to fetch your reports");
  }
};

export const getPending = async (_req, res) => {
  try {
    return res.status(200).json({ success: true, data: await getPendingReports() });
  } catch (error) {
    return sendError(res, error, "Failed to fetch pending reports");
  }
};

export const review = async (req, res) => {
  try {
    const { status, note } = reviewReportSchema.parse(req.body);
    const report = await reviewReport({ reportId: req.params.id, moderatorId: req.user._id, status, note });
    return res.status(200).json({ success: true, message: "Report reviewed successfully", data: report });
  } catch (error) {
    return sendError(res, error, "Failed to review report");
  }
};
