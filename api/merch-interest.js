const { submitMerchInterest } = require("../server/api/_merch-interest");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const result = await submitMerchInterest(req);
    res.status(200).json({
      ok: true,
      id: result.id,
      color: result.color,
      message:
        "Thanks, we saved your interest. Payment is a second phase: we will email you a Stripe link when the batch is ready.",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not save merch interest.",
    });
  }
};
