import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import Session from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import {generateOtp, getOtpHtml} from "../utils/utils.js";
import Otp from "../models/otp.model.js";
import { send } from "process";

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

    const otp = generateOtp();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await Otp.create({
      email,
      userId: user._id,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
    });

    await sendEmail(
      email,
      "OTP Verification",
      `Your OTP code is: ${otp}`,
      html
    );

    // const refreshToken = jwt.sign(
    //   {
    //     id: user._id,
    //   },
    //   config.JWT_SECRET,
    //   {
    //     expiresIn: "7d",
    //   },
    // );

    // const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // const session = await Session.create({
    //   userId: user._id,
    //   refreshTokenHash,
    //   ip: req.ip,
    //   userAgent: req.headers["user-agent"]
    // })

    // const accessToken = jwt.sign(
    //   {
    //     id: user._id,
    //     sessionId: session._id,
    //   },
    //   config.JWT_SECRET,
    //   {
    //     expiresIn: "15m",
    //   },
    // );

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "strict",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    res.status(201).json({
      message: "User registered sucessfully.",
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
      //accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function handleGetMe(req, res) {
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
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function handleRefreshToken(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return res.status(401).json({ message: "Refresh Token not found." });

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const refreshTokenHash = crypto.createHash("256").update(refreshToken).digest("hex");

    const session = await Session.findOne({
      refreshTokenHash,
      revoked: false
    });

    if(!session) return res.status(400).json({message: "Invalid refresh token."});

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

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

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
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function handleLogout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(400).json({message: "Refresh token not found."});

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.findOne({
      refreshTokenHash,
      revoked : false
    });

    if(!session) return res.status(400).json({message: "Invalid refresh token."})

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logged out successfully."
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({message: "Internal server error."})
  }
}

export async function handleLogoutAll(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) return res.status(400).json({message: "Refresh token not found."});
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    await Session.updateMany({
      userId: decoded.id,
      revoked: false,
    }, {
      revoked: true,
    });

    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logged out from all devices successfully."
    })
  } catch (err) {
    return res.status(500).json({message: "Internal server error."})
  }
}

export async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
     email
    });

    if(!user) return res.status(404).json({message: "User not found."});

    if(!user.verified) return res.status(400).json({message: "Email not verified. Please verify your email to login."});

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    if(hashedPassword !== user.password) return res.status(400).json({message: "Invalid password."});

    const refreshToken = jwt.sign({
      id: user._id,
    }, config.JWT_SECRET, {
      expiresIn: "7d",
    });
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
      id: user._id,
      sessionId: session._id,
    }, config.JWT_SECRET, {
      expiresIn: "15m",
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "User Logged In successfully.",
      user: {
        username: user.username,
        email: user.email,
      },
      accessToken
    })
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({message: "Internal server error."})
  }
}

export async function handleVerifyEmail(req, res) {
  try {
    const {otp, email} = req.body;

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpRecord = await Otp.findOne({
      email,
      otpHash,
      expiresAt: {$gt: new Date()}
    })

    if(!otpRecord) return res.status(400).json({message: "Invalid or expired OTP."});

    const user = await User.findByIdAndUpdate(otpRecord.userId, {
      verified: true,
    });

    await Otp.deleteMany({userId: otpRecord.userId});
    
    res.status(200).json({
      message: "Email verified successfully.",
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
      }
    })

  } catch (err) {
    return res.status(500).json({message: "Internal server error."});
  }
}