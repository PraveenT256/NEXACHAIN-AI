const User = require("../models/User");

async function getDirectReferrals(req, res, next) {
  try {
    const directReferrals = await User.find({ referredBy: req.user._id })
      .select("fullName email mobileNumber walletBalance accountStatus createdAt")
      .lean();

    res.status(200).json({ success: true, data: directReferrals });
  } catch (error) {
    next(error);
  }
}

/**
 * Builds the full downline as a nested tree. Depth is capped to avoid
 * runaway recursion/queries if the referral chain is unexpectedly deep.
 */
async function buildReferralTree(userId, currentDepth, maxDepth) {
  if (currentDepth > maxDepth) {
    return [];
  }

  const directReferrals = await User.find({ referredBy: userId })
    .select("fullName email walletBalance accountStatus createdAt")
    .lean();

  const tree = [];
  for (const referral of directReferrals) {
    const children = await buildReferralTree(referral._id, currentDepth + 1, maxDepth);
    tree.push({ ...referral, children });
  }

  return tree;
}

async function getReferralTree(req, res, next) {
  try {
    const maxDepth = Number(req.query.maxDepth) || 10;
    const tree = await buildReferralTree(req.user._id, 1, maxDepth);

    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDirectReferrals, getReferralTree };
