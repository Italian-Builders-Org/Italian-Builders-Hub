export const COOKIE_CONSENT_VERSION = "2026-06-19-db";
export const COOKIE_CONSENT_STORAGE_KEY = "italian-builders-cookie-consent";
export const COOKIE_CONSENT_COOKIE_NAME = "italian_builders_cookie_consent";

export type CookieConsentRecord = {
  version: string;
  consentId: string;
  databaseRecordId: string;
  necessary: true;
  analytics: false;
  marketing: false;
  savedAt: string;
};

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<CookieConsentRecord>;

    if (
      parsed.version !== COOKIE_CONSENT_VERSION ||
      parsed.necessary !== true ||
      parsed.analytics !== false ||
      parsed.marketing !== false ||
      typeof parsed.consentId !== "string" ||
      typeof parsed.databaseRecordId !== "string" ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }

    return parsed as CookieConsentRecord;
  } catch {
    return null;
  }
}

function createConsentId() {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  browserCrypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, (byte, index) => {
    const value = byte.toString(16).padStart(2, "0");
    return [4, 6, 8, 10].includes(index) ? `-${value}` : value;
  }).join("");
}

function existingConsentId() {
  if (typeof window === "undefined") return createConsentId();

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!stored) return createConsentId();
    const parsed = JSON.parse(stored) as Partial<CookieConsentRecord>;
    return typeof parsed.consentId === "string"
      ? parsed.consentId
      : createConsentId();
  } catch {
    return createConsentId();
  }
}

function saveNecessaryCookieConsent({
  consentId,
  databaseRecordId,
}: {
  consentId: string;
  databaseRecordId: string;
}) {
  if (typeof window === "undefined") return;

  const consent: CookieConsentRecord = {
    version: COOKIE_CONSENT_VERSION,
    consentId,
    databaseRecordId,
    necessary: true,
    analytics: false,
    marketing: false,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(consent),
  );
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=necessary-v${COOKIE_CONSENT_VERSION}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}

export async function recordNecessaryCookieConsent(authToken?: string | null) {
  if (typeof window === "undefined") {
    throw new Error("Cookie consent can only be recorded in the browser.");
  }

  const consentId = existingConsentId();
  const savedAt = new Date().toISOString();
  const response = await fetch("/api/consent", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      consentId,
      version: COOKIE_CONSENT_VERSION,
      action: "necessary_accepted",
      pagePath: `${window.location.pathname}${window.location.search}`,
      clientSavedAt: savedAt,
      categories: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Could not record cookie consent.");
  }

  saveNecessaryCookieConsent({
    consentId,
    databaseRecordId: data.consentRecordId,
  });

  return readCookieConsent();
}

export function clearCookieConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; Secure`;
}
