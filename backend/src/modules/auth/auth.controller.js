import { registerUser, loginUser } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
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
export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await loginUser(validatedData);

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