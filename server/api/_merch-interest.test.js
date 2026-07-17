const assert = require("node:assert/strict");
const test = require("node:test");

const { mapMerchInterestPayload } = require("./_merch-interest");

function validPayload(overrides = {}) {
  return {
    name: "Ada Builder",
    email: "ada@example.com",
    color: "navy",
    quantity: 1,
    size: "xl",
    addressLine1: "1 Via Roma",
    city: "Milan",
    postalCode: "20100",
    country: "Italy",
    ...overrides,
  };
}

test("enforces one-size merch signups regardless of the requested size", () => {
  const payload = mapMerchInterestPayload(validPayload());

  assert.equal(payload.size, "osfa");
});

test("rejects fractional merch quantities instead of truncating them", () => {
  assert.throws(
    () => mapMerchInterestPayload(validPayload({ quantity: 1.9 })),
    (error) =>
      error.statusCode === 400 &&
      error.message === "Quantity must be between 1 and 20.",
  );
});

test("rejects unsupported merch colors", () => {
  assert.throws(
    () => mapMerchInterestPayload(validPayload({ color: "red" })),
    (error) =>
      error.statusCode === 400 && error.message === "Choose a valid cap color.",
  );
});
