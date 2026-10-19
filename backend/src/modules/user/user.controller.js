
import {
  getCurrentUser,
  updateCurrentUser,
  changeCurrentPassword,
  saveProfilePhoto,

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

export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogforge/profile-photos",
          resource_type: "image",
          transformation: [
            {
              width: 400,
              height: 400,
              crop: "fill",
              gravity: "face",
            },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const user = await saveProfilePhoto(
      req.user._id,
      uploadResult.secure_url
    );

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Profile photo upload failed:", error);

    return res.status(
      error.message === "User not found" ? 404 : 500
    ).json({
      success: false,
      message: "Unable to update your profile photo. Please try again.",
    });
  }
};
