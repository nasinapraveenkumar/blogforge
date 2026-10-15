import {
  claimNextModerationPost,
  approveModerationPost,
  rejectModerationPost,
  getModerationHistory,
} from "./moderation.service.js";

export const claimNext = async (req, res) => {
  try {
    const post = await claimNextModerationPost(req.user._id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "No posts are waiting for moderation",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post claimed successfully",
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to claim moderation post",
    });
  }
};

export const approve = async (req, res) => {
  try {
    const post = await approveModerationPost({
      postId: req.params.id,
      moderatorId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Post approved and published successfully",
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reject = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const post = await rejectModerationPost({
      postId: req.params.id,
      moderatorId: req.user._id,
      reason: reason.trim(),
    });

    res.status(200).json({
      success: true,
      message: "Post rejected and returned to draft",
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await getModerationHistory(req.params.id);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch moderation history",
    });
  }
};