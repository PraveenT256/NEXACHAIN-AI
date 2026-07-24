const express = require("express");
const { getDirectReferrals, getReferralTree } = require("../controllers/referralController");
const protectRoute = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protectRoute);
router.get("/direct", getDirectReferrals);
router.get("/tree", getReferralTree);

module.exports = router;
