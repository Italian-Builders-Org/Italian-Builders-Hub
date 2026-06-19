import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_VERSION,
  recordNecessaryCookieConsent,
  readCookieConsent,
} from "@/lib/consent";
import { supabase } from "@/lib/supabase";

const reopenEventName = "italian-builders:open-cookie-settings";

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(reopenEventName));
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVisible(!readCookieConsent());

    function handleOpenSettings() {
      setExpanded(true);
      setVisible(true);
    }

    window.addEventListener(reopenEventName, handleOpenSettings);
    return () => {
      window.removeEventListener(reopenEventName, handleOpenSettings);
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { data } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      await recordNecessaryCookieConsent(data.session?.access_token);
      setVisible(false);
      setExpanded(false);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not record cookie consent.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 text-zinc-300 shadow-2xl backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Cookie preferences
          </div>
          <p className="text-sm leading-6 text-zinc-400">
            We use only strictly necessary cookies and local storage right now:
            sign-in/session storage, security, interface preferences, and this
            cookie notice. We do not use advertising cookies or analytics
            cookies at this time.
          </p>

          {expanded && (
            <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
              <div className="rounded-sm border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="mb-1 font-semibold text-zinc-200">
                  Strictly necessary
                </div>
                <p>
                  Always on. Required for login, security, preferences, and
                  uploads.
                </p>
              </div>
              <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-3 opacity-70">
                <div className="mb-1 font-semibold text-zinc-300">
                  Analytics
                </div>
                <p>
                  Not enabled. This category is reserved for future consent.
                </p>
              </div>
              <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-3 opacity-70">
                <div className="mb-1 font-semibold text-zinc-300">
                  Marketing
                </div>
                <p>
                  Not enabled. This category is reserved for future consent.
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 text-[11px] text-zinc-600">
            Consent version {COOKIE_CONSENT_VERSION}. You can change this from
            the Privacy Policy page.
          </div>
          {error && (
            <div className="mt-3 text-xs font-medium text-red-300">{error}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/privacy"
            className="inline-flex h-9 items-center justify-center rounded-sm border border-zinc-800 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            Privacy policy
          </a>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex h-9 items-center justify-center rounded-sm border border-zinc-800 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            {expanded ? "Hide details" : "Manage"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
          >
            {saving ? "Saving..." : "Accept necessary"}
          </button>
        </div>
      </div>
    </div>
  );
}
