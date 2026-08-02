import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "@/lib/api";
import { passwordStrength } from "@/lib/passwordStrength";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(next);
  const matches = confirm.length > 0 && confirm === next;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!current || !next || next !== confirm) return;
    setSaving(true);
    setError(null);
    try {
      await changePassword(current, next);
      navigate("/reset-password/success", { state: { returnTo: "/account/security" } });
    } catch {
      setError("We couldn't update your password just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[950px] px-6 pb-12">
      <nav className="flex min-h-[67px] items-center border-b border-plum/[0.1]">
        <span className="text-[20px] font-extrabold tracking-[-1px] text-plum">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </span>
        <Link to="/account/security" className="ml-[25px] text-[9px] font-extrabold text-mulberry">
          ← Account &amp; Security
        </Link>
      </nav>

      <section className="mx-auto my-[55px] max-w-[520px]">
        <h1 className="font-display text-[36px] text-plum">Change your password</h1>
        <p className="mb-5 mt-[6px] text-[10px] leading-[1.55] text-ink/60">
          Choose a new, unique password to keep your wishes private.
        </p>

        <form onSubmit={handleSubmit} className="rounded-[22px] border border-plum/[0.1] bg-white p-[23px] shadow-[0_8px_22px_rgba(13,6,14,0.06)]">
          <label className="relative my-[13px] block">
            <span className="mb-[6px] block text-[9px] font-extrabold text-plum">Current password</span>
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="h-[43px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-[10px] text-[10px] font-medium text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-[10px] top-[35px] text-[8px] font-extrabold text-mulberry"
            >
              {showCurrent ? "HIDE" : "SHOW"}
            </button>
          </label>

          <label className="relative my-[13px] block">
            <span className="mb-[6px] block text-[9px] font-extrabold text-plum">New password</span>
            <input
              type={showNext ? "text" : "password"}
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="h-[43px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-[10px] text-[10px] font-medium text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute right-[10px] top-[35px] text-[8px] font-extrabold text-mulberry"
            >
              {showNext ? "HIDE" : "SHOW"}
            </button>
          </label>

          <div className="my-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <i
                key={i}
                className="h-1 flex-1 rounded-pill"
                style={{ backgroundColor: i < strength.bars ? "#E6C87A" : "#2A162924" }}
              />
            ))}
          </div>
          {strength.label && <span className="text-[8px] font-extrabold text-moss">{strength.label}</span>}
          <p className="mt-[5px] text-[8px] leading-[1.5] text-ink/50">
            At least 10 characters, with a letter and number. Use a password you do not use
            elsewhere.
          </p>

          <label className="relative my-[13px] block">
            <span className="mb-[6px] block text-[9px] font-extrabold text-plum">Confirm new password</span>
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-[43px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-[10px] text-[10px] font-medium text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-[10px] top-[35px] text-[8px] font-extrabold text-mulberry"
            >
              {showConfirm ? "HIDE" : "SHOW"}
            </button>
          </label>
          {confirm.length > 0 && (
            <div className={`mt-[6px] text-[8px] font-extrabold ${matches ? "text-moss" : "text-mulberry"}`}>
              {matches ? "✓ Passwords match" : "Passwords do not match"}
            </div>
          )}

          <div className="mt-4 rounded-[8px] bg-champagne/[0.27] p-[10px] text-[9px] leading-[1.5] text-plum">
            <b>What changes:</b> Updating your password signs you out of other devices. Your
            scheduled wishes, recipients, and delivery dates remain unchanged.
          </div>

          {error && <p className="mt-3 text-[11px] text-mulberry">{error}</p>}

          <div className="mt-[17px] flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !current || !next || !matches}
              className="rounded-pill bg-plum px-[14px] py-[11px] text-[9px] font-extrabold text-porcelain disabled:opacity-50"
            >
              {saving ? "Updating…" : "Update password"}
            </button>
            <Link to="/account/security" className="text-[9px] font-extrabold text-mulberry">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
