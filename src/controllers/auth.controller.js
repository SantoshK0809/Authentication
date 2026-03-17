import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export async function handleRegister(req, res) {
  try {
    const { username, email, password } = req.body;

    const isAlreadyRegister = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (isAlreadyRegister) {
      return res.status(409).json({
        message: "Username or email already exist",
      });
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered sucessfully.",
      user: {
        username: user.username,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }
}

export async function getMe(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token not found." });

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({
      message: "User found sucessfully.",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong." });
  }
}

export async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookie.refreshToken;

    if (!refreshToken)
      return res.status(401).json({ message: "Refresh Token not found." });

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const accessToken = jwt.sign(
      {
        id: decoded.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Access Token successfully generated.",
      accessToken,
    });
  } catch (err) {
    return res.status(500).json({ message: "Something went wrong." });
  }
}
