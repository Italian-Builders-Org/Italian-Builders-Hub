const assert = require("node:assert/strict");
const test = require("node:test");
const { jsonLdScriptContent } = require("./_profile-og");
const builderProfileHandler = require("../../api/builder-profile");

const xssPayload =
  '</script><script>alert(location.origin)</script><script type="application/ld+json">';

test("serializes JSON-LD for an HTML script context", () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `Builder ${xssPayload}`,
    description: "A&B\u2028C\u2029D",
  };

  const serialized = jsonLdScriptContent(schema);

  assert.doesNotMatch(serialized, /<\/script/i);
  assert.doesNotMatch(serialized, /<script/i);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u0026/);
  assert.deepEqual(JSON.parse(serialized), schema);
});

test("builder profile HTML does not emit executable JSON-LD text", () => {
  const html = builderProfileHandler._internal.injectMetadata(
    "<!doctype html><html><head><title>Old</title></head><body></body></html>",
    {
      title: `Builder ${xssPayload}`,
      description: `Profile ${xssPayload}`,
      origin: "https://italianbuilders.co",
      url: "https://italianbuilders.co/builders/domenico",
      image: "https://italianbuilders.co/api/og-profile-image?username=domenico",
      imageAlt: `Builder ${xssPayload}`,
      profile: {
        full_name: `Domenico ${xssPayload}`,
        username: "domenico",
        headline: `Founder ${xssPayload}`,
        role: "Founder",
        bio: `Bio ${xssPayload}`,
        avatar_url: "/avatar.png",
        skills: [`Skill ${xssPayload}`],
        city: "Milan",
        country: "Italy",
      },
    },
  );

  assert.doesNotMatch(html, /<script>alert\(location\.origin\)<\/script>/i);
  assert.doesNotMatch(
    html,
    /<\/script><script>alert\(location\.origin\)<\/script>/i,
  );
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.match(html, /<script type="application\/ld\+json">/);
});
