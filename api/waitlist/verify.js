const {
  verifyWaitlistEmail,
} = require("../../server/api/_waitlist-verification");

function htmlPage({ title, body, status = 200 }) {
  return {
    status,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;background:#09090b;color:#e4e4e7;font-family:Inter,system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}.box{max-width:520px;padding:32px;border:1px solid #27272a;background:#18181b}a{color:#60a5fa}</style></head><body><main class="box"><h1>${title}</h1><p>${body}</p><p><a href="/">Return to Italian Builders</a></p></main></body></html>`,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (req.method !== "GET") {
    const page = htmlPage({
      title: "Method not allowed",
      body: "This verification link only supports GET requests.",
      status: 405,
    });
    res.status(page.status).send(page.html);
    return;
  }

  try {
    await verifyWaitlistEmail(req.query.token);
    const page = htmlPage({
      title: "Email verified",
      body: "Your waitlist request is confirmed. You are now on the Italian Builders waitlist.",
    });
    res.status(page.status).send(page.html);
  } catch (error) {
    const page = htmlPage({
      title: "Verification failed",
      body:
        error instanceof Error
          ? error.message
          : "This verification link could not be used.",
      status: error.statusCode || 500,
    });
    res.status(page.status).send(page.html);
  }
};
