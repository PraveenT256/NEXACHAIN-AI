const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protectRoute(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: "User belonging to this token no longer exists" });
    }

    if (currentUser.accountStatus !== "Active") {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }
}

module.exports = protectRoute;
