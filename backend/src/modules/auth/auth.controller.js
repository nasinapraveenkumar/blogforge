
import { registerUser, loginUser } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

// Shared cookie configuration
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

// Register user
export const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const user = await registerUser(validatedData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await loginUser(validatedData);

    res.cookie("token", user.token, getCookieOptions());

    delete user.token;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
export const logout = (req, res) => {
  const { maxAge, ...clearOptions } = getCookieOptions();

  res.clearCookie("token", clearOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
