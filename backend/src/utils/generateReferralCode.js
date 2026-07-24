const crypto = require("crypto");

function generateReferralCode(fullName) {
  const namePart = fullName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${namePart}${randomPart}`;
}

module.exports = generateReferralCode;
