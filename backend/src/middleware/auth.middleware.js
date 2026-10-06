import jwt from "jsonwebtoken";
import User from "../modules/auth/auth.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

const user = await User.findById(decoded.userId).select("-password");

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User not found",
  });
}

if (!user.isActive) {
  return res.status(403).json({
    success: false,
    message: "Your account has been suspended",
  });
}

req.user = user;

next();
    } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};