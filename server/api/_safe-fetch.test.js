const assert = require("node:assert/strict");
const dns = require("node:dns").promises;
const { PassThrough } = require("node:stream");
const test = require("node:test");
const http = require("node:http");

const {
  isBlockedIp,
  safeFetch,
  validatePublicHttpUrl,
} = require("./_safe-fetch");

test("blocks local, private, link-local, multicast, and metadata addresses", async () => {
  const blockedUrls = [
    "http://localhost/",
    "http://admin.localhost/",
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://172.16.0.1/",
    "http://192.168.0.1/",
    "http://169.254.169.254/",
    "http://224.0.0.1/",
    "http://[::1]/",
    "http://[fe80::1]/",
    "http://[fc00::1]/",
    "http://[fd00:ec2::254]/",
    "http://[ff02::1]/",
    "http://metadata.google.internal/",
  ];

  for (const url of blockedUrls) {
    await assert.rejects(() => validatePublicHttpUrl(url));
  }

  assert.equal(isBlockedIp("8.8.8.8"), false);
  assert.equal(isBlockedIp("2606:4700:4700::1111"), false);
});

test("rejects malformed hostnames before DNS lookup", async () => {
  await assert.rejects(
    () => validatePublicHttpUrl("http://bad_host.example/"),
    /malformed/,
  );
  await assert.rejects(
    () => validatePublicHttpUrl("http://-bad.example/"),
    /malformed/,
  );
});

test("rejects hostnames that resolve to blocked addresses", async (t) => {
  const originalLookup = dns.lookup;
  t.after(() => {
    dns.lookup = originalLookup;
  });

  dns.lookup = async () => [{ address: "10.1.2.3", family: 4 }];

  await assert.rejects(
    () => validatePublicHttpUrl("https://public-name.example/"),
    /private or local/,
  );
});

test("validates redirect targets before following them", async (t) => {
  const originalLookup = dns.lookup;
  const originalRequest = http.request;
  const calls = [];

  t.after(() => {
    dns.lookup = originalLookup;
    http.request = originalRequest;
  });

  dns.lookup = async () => [{ address: "93.184.216.34", family: 4 }];
  http.request = (options, callback) => {
    calls.push(options);
    return fakeRequest(callback, {
      statusCode: 302,
      statusMessage: "Found",
      headers: { location: "http://127.0.0.1/internal" },
      body: "",
    });
  };

  await assert.rejects(
    () => safeFetch("http://example.test/"),
    /private or local/,
  );
  assert.equal(calls.length, 1);
});

test("returns public responses through the safe request path", async (t) => {
  const originalLookup = dns.lookup;
  const originalRequest = http.request;

  t.after(() => {
    dns.lookup = originalLookup;
    http.request = originalRequest;
  });

  dns.lookup = async () => [{ address: "93.184.216.34", family: 4 }];
  http.request = (_options, callback) =>
    fakeRequest(callback, {
      statusCode: 200,
      statusMessage: "OK",
      headers: { "content-type": "text/plain" },
      body: "ok",
    });

  const response = await safeFetch("http://example.test/");
  assert.equal(response.ok, true);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/plain");
  assert.equal(Buffer.from(await response.arrayBuffer()).toString("utf8"), "ok");
});

function fakeRequest(callback, response) {
  return {
    setTimeout() {},
    on() {},
    write() {},
    end() {
      const stream = new PassThrough();
      stream.statusCode = response.statusCode;
      stream.statusMessage = response.statusMessage;
      stream.headers = response.headers;
      callback(stream);
      stream.end(response.body);
    },
    destroy(error) {
      if (error) throw error;
    },
  };
}
