const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const generateReferralCode = require("../utils/generateReferralCode");
const generateToken = require("../utils/generateToken");

async function registerUser(req, res, next) {
  try {
    const { fullName, email, mobileNumber, password, referralCode } = req.body;

    if (!fullName || !email || !mobileNumber || !password) {
      throw new AppError("Full name, email, mobile number and password are required", 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        throw new AppError("Invalid referral code", 400);
      }
      referredBy = referrer._id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let newReferralCode = generateReferralCode(fullName);
    while (await User.findOne({ referralCode: newReferralCode })) {
      newReferralCode = generateReferralCode(fullName);
    }

    const newUser = await User.create({
      fullName,
      email,
      mobileNumber,
      passwordHash,
      referralCode: newReferralCode,
      referredBy,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          referralCode: newUser.referralCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.accountStatus !== "Active") {
      throw new AppError("Your account is not active. Please contact support.", 403);
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          referralCode: user.referralCode,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber,
        referralCode: req.user.referralCode,
        walletBalance: req.user.walletBalance,
        totalRoiEarned: req.user.totalRoiEarned,
        totalLevelIncomeEarned: req.user.totalLevelIncomeEarned,
        accountStatus: req.user.accountStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { registerUser, loginUser, getCurrentUser };
