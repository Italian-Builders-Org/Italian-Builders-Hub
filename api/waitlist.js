const {
  requestWaitlistVerification,
} = require("../server/api/_waitlist-verification");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
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
