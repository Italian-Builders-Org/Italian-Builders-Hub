const {
  requestWaitlistVerification,
} = require("../server/api/_waitlist-verification");
const { submitMerchInterest } = require("../server/api/_merch-interest");

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    if (queryValue(req.query?.action) === "merch-interest") {
      const result = await submitMerchInterest(req);
      res.status(200).json({
        ok: true,
        id: result.id,
        color: result.color,
        message:
          "Thanks, we saved your interest. Payment is a second phase: we will email you a Stripe link when the batch is ready.",
      });
      return;
    }

    const result = await requestWaitlistVerification(req);
    res.status(202).json({
      ok: true,
      message: result.alreadyVerified
        ? "If this email is already on the waitlist, no further action is needed."
        : "Check your email to confirm your waitlist request.",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not start email verification.",
    });
  }
};
