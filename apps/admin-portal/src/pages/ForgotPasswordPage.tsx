import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordResetCode } from "@/lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const trimmedEmail = email.trim();
    const { maskedEmail } = await requestPasswordResetCode(trimmedEmail);
    setSending(false);
    navigate("/reset-password", { state: { email: trimmedEmail, maskedEmail } });
  }

  return (
    <main className="min-h-screen w-full bg-midnight text-porcelain">
      <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-7">
        <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.13]">
          <span className="text-[21px] font-extrabold tracking-[-1.4px]">
            Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
            Dem
          </span>
          <Link to="/login" className="ml-auto text-[9px] font-extrabold text-champagne">
            ← Back to sign in
          </Link>
        </nav>

        <section className="mx-auto my-[58px] max-w-[460px] sm:my-[103px]">
          <span className="text-[8px] font-extrabold tracking-[0.14em] text-champagne">
            PASSWORD RECOVERY
          </span>
          <h1 className="my-[11px] font-display text-[clamp(34px,4vw,39px)] leading-[1.1]">
            Reset your password
          </h1>
          <p className="mb-[22px] text-[11px] leading-[1.6] text-porcelain/68">
            Enter the email you use for WishDem and we'll send a one-time code.
          </p>

          <form onSubmit={handleSubmit} className="rounded-[22px] bg-paper p-6 text-ink shadow-deep">
            <div className="mb-4 rounded-[8px] bg-champagne/[0.26] p-[10px] text-[9px] leading-[1.5] text-plum">
              <b>A private step back:</b> if there's a WishDem account connected to this email,
              we'll send a six-digit code. We won't reveal account details here.
            </div>
            <label className="block">
              <span className="mb-[6px] block text-[9px] font-extrabold">Email address</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-[43px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-[10px] text-[10px] font-medium text-ink outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              className="mt-[15px] w-full rounded-pill bg-plum px-3 py-[12px] text-[9px] font-extrabold text-[#F6F0E8] disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send code"}
            </button>
            <p className="mt-[14px] text-center text-[8px] text-ink/55">
              No longer have access to this email?{" "}
              <a href="mailto:support@wishdem.example" className="font-extrabold text-mulberry">
                Contact support
              </a>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
