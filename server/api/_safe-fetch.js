const dns = require("node:dns").promises;
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;

const METADATA_HOSTNAMES = new Set(["metadata.google.internal"]);

function normalizeHostname(hostname) {
  let value = String(hostname || "").trim().toLowerCase();
  if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1);
  if (value.endsWith(".")) value = value.slice(0, -1);
  return value;
}

function assertValidHostname(hostname) {
  const host = normalizeHostname(hostname);
  if (!host) throw new Error("URL hostname is required.");
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("Local URLs are not supported.");
  }
  if (METADATA_HOSTNAMES.has(host)) {
    throw new Error("Metadata service URLs are not supported.");
  }
  if (net.isIP(host)) return host;
  if (host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) {
    throw new Error("URL hostname is malformed.");
  }

  const labels = host.split(".");
  if (labels.some((label) => !label)) {
    throw new Error("URL hostname is malformed.");
  }
  for (const label of labels) {
    if (
      label.length > 63 ||
      label.startsWith("-") ||
      label.endsWith("-") ||
      !/^[a-z0-9-]+$/.test(label)
    ) {
      throw new Error("URL hostname is malformed.");
    }
  }
  return host;
}

function parsePublicHttpUrl(input, base) {
  const url = new URL(input, base);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http and https URLs are supported.");
  }
  assertValidHostname(url.hostname);
  return url;
}

function ipv4ToNumber(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const byte = Number(part);
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) return null;
    value = (value << 8) + byte;
  }
  return value >>> 0;
}

function inIpv4Range(value, cidrBase, bits) {
  const base = ipv4ToNumber(cidrBase);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((value & mask) >>> 0) === ((base & mask) >>> 0);
}

function isBlockedIpv4(ip) {
  const value = ipv4ToNumber(ip);
  if (value === null) return true;
  return [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ].some(([base, bits]) => inIpv4Range(value, base, bits));
}

function expandIpv6(ip) {
  let value = normalizeHostname(ip);
  if (value.includes("%")) throw new Error("Scoped IPv6 addresses are not supported.");

  if (value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const ipv4 = value.slice(lastColon + 1);
    const ipv4Number = ipv4ToNumber(ipv4);
    if (ipv4Number === null) throw new Error("IPv6 address is malformed.");
    const high = ((ipv4Number >>> 16) & 0xffff).toString(16);
    const low = (ipv4Number & 0xffff).toString(16);
    value = `${value.slice(0, lastColon)}:${high}:${low}`;
  }

  const halves = value.split("::");
  if (halves.length > 2) throw new Error("IPv6 address is malformed.");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - left.length - right.length : 0;
  if (fill < 0) throw new Error("IPv6 address is malformed.");
  const segments = [
    ...left,
    ...Array.from({ length: fill }, () => "0"),
    ...right,
  ];
  if (segments.length !== 8) throw new Error("IPv6 address is malformed.");
  return segments.map((segment) => {
    if (!/^[0-9a-f]{1,4}$/i.test(segment)) {
      throw new Error("IPv6 address is malformed.");
    }
    return Number.parseInt(segment, 16);
  });
}

function isBlockedIpv6(ip) {
  let segments;
  try {
    segments = expandIpv6(ip);
  } catch {
    return true;
  }

  const first = segments[0] >>> 8;
  const second = segments[0] & 0xff;
  const allZero = segments.every((segment) => segment === 0);
  const loopback =
    segments.slice(0, 7).every((segment) => segment === 0) && segments[7] === 1;
  const uniqueLocal = (first & 0xfe) === 0xfc;
  const linkLocal = first === 0xfe && (second & 0xc0) === 0x80;
  const multicast = first === 0xff;
  const ipv4Mapped =
    segments.slice(0, 5).every((segment) => segment === 0) &&
    segments[5] === 0xffff;

  if (ipv4Mapped) {
    const ipv4 = [
      segments[6] >>> 8,
      segments[6] & 0xff,
      segments[7] >>> 8,
      segments[7] & 0xff,
    ].join(".");
    return isBlockedIpv4(ipv4);
  }

  return allZero || loopback || uniqueLocal || linkLocal || multicast;
}

function isBlockedIp(address) {
  const ip = normalizeHostname(address);
  const family = net.isIP(ip);
  if (family === 4) return isBlockedIpv4(ip);
  if (family === 6) return isBlockedIpv6(ip);
  return true;
}

async function resolvePublicAddresses(url) {
  const host = assertValidHostname(url.hostname);
  const family = net.isIP(host);
  const addresses = family
    ? [{ address: host, family }]
    : await dns.lookup(host, { all: true, verbatim: true });

  if (!addresses.length) throw new Error("URL hostname could not be resolved.");
  const blocked = addresses.find((entry) => isBlockedIp(entry.address));
  if (blocked) {
    throw new Error("URL resolves to a private or local network address.");
  }
  return addresses;
}

async function validatePublicHttpUrl(input, base) {
  const url = parsePublicHttpUrl(input, base);
  await resolvePublicAddresses(url);
  return url;
}

function makeHeaders(rawHeaders) {
  const normalized = new Map();
  for (const [key, value] of Object.entries(rawHeaders || {})) {
    normalized.set(
      key.toLowerCase(),
      Array.isArray(value) ? value.join(", ") : String(value),
    );
  }
  return {
    get(name) {
      return normalized.get(String(name).toLowerCase()) || null;
    },
  };
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function requestOnce(url, addresses, options) {
  const client = url.protocol === "https:" ? https : http;
  const headers = { ...(options.headers || {}) };
  delete headers.host;
  delete headers.Host;
  headers.host = url.host;

  const hostname = normalizeHostname(url.hostname);
  const lookup = (_hostname, lookupOptions, callback) => {
    const cb = typeof lookupOptions === "function" ? lookupOptions : callback;
    const opts = typeof lookupOptions === "function" ? {} : lookupOptions || {};
    if (opts.all) {
      cb(
        null,
        addresses.map((entry) => ({
          address: entry.address,
          family: entry.family,
        })),
      );
      return;
    }
    const selected =
      addresses.find((entry) =>
        opts.family ? entry.family === opts.family : entry.family === 4,
      ) || addresses[0];
    cb(null, selected.address, selected.family);
  };

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        protocol: url.protocol,
        hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: options.method || "GET",
        headers,
        lookup,
        servername: net.isIP(hostname) ? undefined : hostname,
      },
      (body) => {
        resolve({
          ok: body.statusCode >= 200 && body.statusCode < 300,
          status: body.statusCode,
          statusText: body.statusMessage || "",
          headers: makeHeaders(body.headers),
          body,
          url: url.toString(),
          async arrayBuffer() {
            const buffer = await readStream(body);
            return buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength,
            );
          },
        });
      },
    );
    req.setTimeout(options.timeoutMs || DEFAULT_TIMEOUT_MS, () => {
      req.destroy(new Error("Request timed out."));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function isRedirectStatus(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

async function safeFetch(input, options = {}) {
  let url = parsePublicHttpUrl(input);
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const addresses = await resolvePublicAddresses(url);
    const response = await requestOnce(url, addresses, options);
    if (!isRedirectStatus(response.status)) return response;

    const location = response.headers.get("location");
    response.body.resume();
    if (!location) return response;
    if (redirectCount === maxRedirects) throw new Error("Too many redirects.");
    url = parsePublicHttpUrl(location, url);
  }

  throw new Error("Too many redirects.");
}

module.exports = {
  isBlockedIp,
  parsePublicHttpUrl,
  safeFetch,
  validatePublicHttpUrl,
};
