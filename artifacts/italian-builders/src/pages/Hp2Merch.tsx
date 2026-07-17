import { useCallback, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Hp2TurnstileChallenge, hp2TurnstileSiteKey } from "@/pages/Hp2";

export const MERCH_CAPS = [
  {
    id: "navy" as const,
    label: "Navy",
    image: "/images/merch/cap-navy.jpg",
    swatch: "#1a2744",
  },
  {
    id: "white" as const,
    label: "White",
    image: "/images/merch/cap-white.jpg",
    swatch: "#f4f1ea",
  },
  {
    id: "sky" as const,
    label: "Sky",
    image: "/images/merch/cap-sky.jpg",
    swatch: "#8eb8d8",
  },
] as const;

export type MerchCapColor = (typeof MERCH_CAPS)[number]["id"];

export function Hp2MerchInterestForm({
  selectedColor,
  onColorChange,
}: {
  selectedColor: MerchCapColor;
  onColorChange: (color: MerchCapColor) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetNonce, setTurnstileResetNonce] = useState(0);
  const isTurnstileConfigured = Boolean(hp2TurnstileSiteKey);
  const canSubmit = isTurnstileConfigured && Boolean(turnstileToken);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setErrorMsg((current) =>
      current.includes("security check") || current.includes("Security check")
        ? ""
        : current,
    );
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const handleTurnstileError = useCallback((message: string) => {
    setTurnstileToken("");
    setErrorMsg(message);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const getValue = (key: string) => {
      const value = formData.get(key)?.toString().trim();
      return value || null;
    };

    try {
      if (!isTurnstileConfigured) {
        throw new Error("Security check is not configured. Please try later.");
      }
      if (!turnstileToken) {
        throw new Error("Complete the security check before submitting.");
      }

      const color = String(formData.get("color") ?? selectedColor)
        .trim()
        .toLowerCase() as MerchCapColor;

      const response = await fetch("/api/merch-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          email: String(formData.get("email") ?? "")
            .trim()
            .toLowerCase(),
          phone: getValue("phone"),
          color,
          quantity: Number(formData.get("quantity") ?? 1),
          size: "osfa",
          addressLine1: String(formData.get("addressLine1") ?? "").trim(),
          addressLine2: getValue("addressLine2"),
          city: String(formData.get("city") ?? "").trim(),
          province: getValue("province"),
          postalCode: String(formData.get("postalCode") ?? "").trim(),
          country: String(formData.get("country") ?? "Italy").trim(),
          notes: null,
          turnstileToken,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not submit interest. Please try again.",
        );
      }

      setSubmitted(true);
      form.reset();
      setTurnstileToken("");
      setTurnstileResetNonce((current) => current + 1);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Could not submit interest. Please try again.",
      );
      setTurnstileToken("");
      setTurnstileResetNonce((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="hp2-merch-form-success" role="status">
        <strong>You are on the list.</strong>
        <span>
          We saved your interest and shipping details. Payment is a second
          phase: when the batch opens, we will email you a Stripe link.
        </span>
        <button type="button" onClick={() => setSubmitted(false)}>
          Register another color
        </button>
      </div>
    );
  }

  return (
    <form className="hp2-merch-form" id="interest" onSubmit={handleSubmit}>
      {errorMsg && (
        <p className="hp2-merch-form-error" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="hp2-merch-form-head">
        <p className="hp2-subhero-label">Register interest</p>
        <p>
          One size for everyone. Payment is a second phase via Stripe link by
          email.
        </p>
      </div>

      <div className="hp2-merch-form-grid hp2-merch-form-grid-3">
        <label>
          <span>Color</span>
          <select
            name="color"
            required
            value={selectedColor}
            onChange={(event) =>
              onColorChange(event.target.value as MerchCapColor)
            }
          >
            {MERCH_CAPS.map((cap) => (
              <option key={cap.id} value={cap.id}>
                {cap.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Quantity</span>
          <input
            name="quantity"
            type="number"
            required
            min={1}
            max={20}
            defaultValue={1}
          />
        </label>
        <label>
          <span>Size</span>
          <input value="One size" readOnly tabIndex={-1} aria-readonly="true" />
        </label>
      </div>

      <div className="hp2-merch-form-grid">
        <label>
          <span>Name</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
          />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
          />
        </label>
        <label>
          <span>Phone (optional)</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+39 ..."
          />
        </label>
        <label>
          <span>Country</span>
          <input
            name="country"
            required
            autoComplete="country-name"
            defaultValue="Italy"
          />
        </label>
      </div>

      <label className="hp2-merch-form-span">
        <span>Address</span>
        <input
          name="addressLine1"
          required
          autoComplete="address-line1"
          placeholder="Street and number"
        />
      </label>

      <label className="hp2-merch-form-span">
        <span>Address line 2 (optional)</span>
        <input
          name="addressLine2"
          autoComplete="address-line2"
          placeholder="Apartment, floor, c/o"
        />
      </label>

      <div className="hp2-merch-form-grid hp2-merch-form-grid-3">
        <label>
          <span>City</span>
          <input
            name="city"
            required
            autoComplete="address-level2"
            placeholder="City"
          />
        </label>
        <label>
          <span>Province</span>
          <input
            name="province"
            autoComplete="address-level1"
            placeholder="MI, RM..."
          />
        </label>
        <label>
          <span>Postal code</span>
          <input
            name="postalCode"
            required
            autoComplete="postal-code"
            placeholder="20100"
          />
        </label>
      </div>

      <p className="hp2-merch-form-note">
        Interest only. We email a Stripe payment link before printing.
      </p>

      <div className="hp2-merch-form-check">
        {isTurnstileConfigured && hp2TurnstileSiteKey ? (
          <Hp2TurnstileChallenge
            siteKey={hp2TurnstileSiteKey}
            resetNonce={turnstileResetNonce}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileError}
          />
        ) : (
          <span>Security check is not configured yet.</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? "Saving..." : "Register interest"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
