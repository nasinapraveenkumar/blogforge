
import bcrypt from "bcryptjs";
import User from "../auth/auth.model.js";

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateCurrentUser = async (userId, name) => {
  const cleanName = name.trim();

  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new Error("Name must be between 2 and 50 characters");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name: cleanName } },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const changeCurrentPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    throw new Error("Both password fields are required");
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new Error("New password must be between 8 and 128 characters");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { message: "Password changed successfully" };
};

export const saveProfilePhoto = async (userId, profilePhoto) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { profilePhoto } },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
