
import bcrypt from "bcryptjs";
import User from "./auth.model.js";
import { generateToken } from "../../utils/jwt.js";

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  console.log("Registration database:", User.db.name);
  console.log("Registration collection:", User.collection.name);
  console.log("Checking registration email:", normalizedEmail);

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  console.log(
    "Duplicate check result:",
    existingUser ? "FOUND" : "NOT FOUND"
  );

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated.");
  }

  const token = generateToken({
    userId: user._id,
    role: user.role,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };
};
