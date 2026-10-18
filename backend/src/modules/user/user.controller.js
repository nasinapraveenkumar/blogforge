
import {
  getCurrentUser,
  updateCurrentUser,
  changeCurrentPassword,
} from "./user.service.js";

export const getMe = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await updateCurrentUser(req.user._id, name);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await changeCurrentPassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
