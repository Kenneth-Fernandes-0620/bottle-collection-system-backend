import { Router, Request, Response, Application } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserById,
  findUserByUsername,
} from "../controllers/authController";
import { authenticateJWT } from "../utils/authUtils";

const router = Router();

// Signup route
router.post("/signup", async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    // Check if the user already exists
    const userExists = await findUserByUsername(username);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await createUser(username, hashedPassword);

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login route
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = findUserByUsername(username);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.SECRET_KEY ||
        "8e0f16e244aeb7b71fa3ab9299db3bc3e465d2b91962a5b4890c86b1da6c7fc1",
      { expiresIn: "1h" }
    );

    // Set the token as a cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Logout route
router.post("/logout", async (req: Request, res: Response): Promise<any> => {
  res.clearCookie("auth_token");
  return res.json({ message: "Logged out successfully" });
});

// // Get User Details
router.get(
  "/user",
  authenticateJWT,
  async (req: Request, res: Response): Promise<any> => {
    if (req.user == undefined) {
      return res.status(404).json({ message: "User details missing" });
    }
    try {
      const userId = req.user.id; // Assuming user ID is stored in req.user by middleware
      const user = await findUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update User Details
router.post("/user", async (req: Request, res: Response): Promise<any> => {
  // TODO: Implement Function
  throw new Error("Unimplemented Function");
});

export default router;
