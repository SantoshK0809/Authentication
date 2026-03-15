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

    if (isAlreadyRegister) return;
    res.status(409).json({
      message: "Username or email already exist",
    });

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: user._id,
      },
      config.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(201).json({
      message: "User registered sucessfully.",
      user : {
        username : user.username,
        email : user.email
      },
      token
    });
  } catch (error) {
    return res.status(404).json({ message: "Something went wrong." });
  }
}
