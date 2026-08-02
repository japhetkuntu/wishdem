import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { resetPasswordWithCode } from "@/lib/api";
import { passwordStrength } from "@/lib/passwordStrength";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60;
const RESEND_SECONDS = 30;

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STEPS = [
  { n: 1, label: "Find account" },
  { n: 2, label: "Check email" },
  { n: 3, label: "New password" },
  { n: 4, label: "Updated" },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const maskedEmail = (location.state as { maskedEmail?: string } | null)?.maskedEmail ?? "a•••••@mail.com";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [expiresIn, setExpiresIn] = useState(EXPIRY_SECONDS);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpiresIn((s) => Math.max(0, s - 1));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? ""));
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  const code = digits.join("");
  const strength = passwordStrength(next);
  const matches = confirm.length > 0 && confirm === next;
  const codeComplete = code.length === CODE_LENGTH;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codeComplete || !matches || expiresIn === 0) return;
    setSaving(true);
    setError(null);
    try {
      await resetPasswordWithCode(code, next);
      navigate("/reset-password/success", { state: { returnTo: "/login" } });
    } catch {
      setError("We couldn't reset your password just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 pb-[45px]">
      <nav className="flex min-h-[66px] items-center border-b border-plum/[0.09]">
        <span className="text-[20px] font-extrabold tracking-[-1.2px] text-plum">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </span>
        <div className="ml-auto hidden gap-[7px] sm:flex">
          {STEPS.map((step) => (
            <span
              key={step.n}
              className={clsx("flex items-center text-[8px] font-extrabold", step.n <= 2 ? "text-mulberry" : "text-ink/50")}
            >
              <b
                className={clsx(
                  "mr-1 grid h-[15px] w-[15px] place-items-center rounded-full",
                  step.n <= 2 ? "bg-champagne text-plum" : "bg-plum/[0.09]",
                )}
              >
                {step.n}
              </b>
              {step.label}
            </span>
          ))}
        </div>
      </nav>

      <section className="mx-auto my-[43px] max-w-[510px]">
        <span className="text-[8px] font-extrabold tracking-[0.13em] text-mulberry">
          PASSWORD RECOVERY
        </span>
        <h1 className="my-[10px] font-display text-[35px] leading-[1.1] text-plum">
          Create a new password
        </h1>
        <p className="mb-[18px] text-[10px] leading-[1.55] text-ink/60">
          First confirm the code sent to <b className="text-plum">{maskedEmail}</b>, then choose a
          new password.
        </p>

        <form onSubmit={handleSubmit} className="rounded-[22px] border border-plum/[0.1] bg-white p-[22px] shadow-[0_8px_23px_rgba(13,6,14,0.07)]">
          <h2 className="font-display text-[22px] text-plum">Check your email</h2>
          <p className="mb-[13px] mt-1 text-[9px] leading-[1.5] text-ink/55">
            Enter the six-digit code from our most recent message. It is valid for 10 minutes.
          </p>

          <div className="mb-2 flex gap-[7px]">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onPaste={handlePaste}
                inputMode="numeric"
                maxLength={1}
                className="h-[45px] w-full rounded-[8px] border border-plum/[0.15] bg-background text-center text-[18px] font-semibold text-plum outline-none focus:border-champagne"
              />
            ))}
          </div>
          <div className="mb-[18px] flex justify-between text-[8px] text-ink/55">
            <span>
              Code expires in <b className={clsx("font-extrabold", expiresIn === 0 ? "text-mulberry" : "text-mulberry")}>{formatClock(expiresIn)}</b>
            </span>
            <span>
              {resendIn > 0 ? (
                <b className="font-extrabold text-mulberry">Resend available in {formatClock(resendIn)}</b>
              ) : (
                <button type="button" onClick={() => setResendIn(RESEND_SECONDS)} className="font-extrabold text-mulberry underline">
                  Resend code
                </button>
              )}
            </span>
          </div>

          <hr className="my-4 border-plum/[0.08]" />

          <h2 className="font-display text-[22px] text-plum">Choose a new password</h2>
          <p className="mb-[13px] mt-1 text-[9px] leading-[1.5] text-ink/55">
            Use a unique password to keep your wishes private.
          </p>

          <label className="relative my-3 block">
            <span className="mb-[6px] block text-[9px] font-extrabold text-plum">New password</span>
            <input
              type={showNext ? "text" : "password"}
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="h-[40px] w-full rounded-[8px] border border-plum/[0.15] bg-background px-[10px] text-[10px] font-medium text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute bottom-[13px] right-[10px] text-[8px] font-extrabold text-mulberry"
            >
              {showNext ? "HIDE" : "SHOW"}
            </button>
            <div className="mt-[7px] flex gap-[3px]">
              {[0, 1, 2, 3].map((i) => (
                <i
                  key={i}
                  className="h-1 flex-1 rounded-pill"
                  style={{ backgroundColor: i < strength.bars ? "#E6C87A" : "#2A162924" }}
                />
              ))}
            </div>
            {strength.label && <strong className="mt-[5px] block text-[8px] font-extrabold text-moss">{strength.label}</strong>}
            <small className="mt-[5px] block text-[8px] leading-[1.45] text-ink/50">
              At least 10 characters, with a letter and number. Avoid common passwords and your
              email address.
            </small>
          </label>

          <label className="my-3 block">
            <span className="mb-[6px] block text-[9px] font-extrabold text-plum">Confirm new password</span>
            <input
              type={showNext ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-[40px] w-full rounded-[8px] border border-plum/[0.15] bg-background px-[10px] text-[10px] font-medium text-ink outline-none"
            />
          </label>
          {confirm.length > 0 && (
            <div className={clsx("-mt-1 text-[8px] font-extrabold", matches ? "text-moss" : "text-mulberry")}>
              {matches ? "✓ Passwords match" : "Passwords do not match"}
            </div>
          )}

          <div className="mt-[14px] rounded-[8px] bg-champagne/[0.26] p-[9px] text-[8px] leading-[1.45] text-plum">
            <b>After reset:</b> other signed-in devices will be signed out. Your wishes,
            recipients, and planned delivery dates will not change.
          </div>

          {error && <p className="mt-3 text-[10px] text-mulberry">{error}</p>}
          {expiresIn === 0 && (
            <p className="mt-3 text-[10px] text-mulberry">
              Your code has expired. Please request a new one.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !codeComplete || !matches || expiresIn === 0}
            className="mt-[14px] w-full rounded-pill bg-plum px-3 py-[11px] text-[9px] font-extrabold text-porcelain disabled:opacity-50"
          >
            {saving ? "Resetting…" : "Reset password"}
          </button>
          <p className="mt-3 text-center text-[8px] text-ink/55">
            Need another route?{" "}
            <Link to="/forgot-password" className="font-extrabold text-mulberry">
              Use a different email
            </Link>{" "}
            ·{" "}
            <a href="mailto:support@wishdem.example" className="font-extrabold text-mulberry">
              Contact support
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
