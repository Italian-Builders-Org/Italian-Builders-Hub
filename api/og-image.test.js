const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const test = require("node:test");

const ogImageHandler = require("./og-image");
const { metaContents } = require("../server/api/_og-image-import");

test("reads limited Node streams without requiring a web stream reader", async () => {
  const body = Readable.from(["open ", Buffer.from("graph")]);

  const bytes = await ogImageHandler._internal.readLimited({ body }, 20);

  assert.equal(Buffer.from(bytes).toString("utf8"), "open graph");
});

test("reads limited web streams when a stream reader is available", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("open "));
      controller.enqueue(new TextEncoder().encode("graph"));
      controller.close();
    },
  });

  const bytes = await ogImageHandler._internal.readLimited({ body }, 20);

  assert.equal(Buffer.from(bytes).toString("utf8"), "open graph");
});

test("rejects oversized Open Graph responses while streaming", async () => {
  const body = Readable.from(["too large"]);

  await assert.rejects(
    () => ogImageHandler._internal.readLimited({ body }, 3),
    /too large/i,
  );
});

test("collects fallback Open Graph image candidates without duplicates", () => {
  const html = `
    <meta property="og:image:secure_url" content="https://example.com/missing.png">
    <meta property="og:image" content="https://example.com/missing.png">
    <meta name="twitter:image" content="https://example.com/fallback.png">
  `;

  assert.deepEqual(
    metaContents(html, ["og:image:secure_url", "og:image", "twitter:image"]),
    ["https://example.com/missing.png", "https://example.com/fallback.png"],
  );
});
