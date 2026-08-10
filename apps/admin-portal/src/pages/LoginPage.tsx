import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSigning(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate("/overview");
    } catch {
      setError("We couldn't sign you in just now. Please check your email and password and try again.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-midnight text-porcelain">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        <nav className="flex min-h-[70px] items-center border-b border-porcelain/[0.12]">
          <span className="text-[21px] font-extrabold tracking-[-1.4px]">
            Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
            Dem
          </span>
          <span className="ml-[10px] border-l border-porcelain/[0.23] pl-[10px] text-[9px] font-extrabold tracking-[0.1em] text-porcelain/65">
            ADMIN PORTAL
          </span>
        </nav>

        <section className="mx-auto grid max-w-[920px] gap-[60px] pt-[70px] sm:grid-cols-[.9fr_1.1fr] sm:items-center sm:pt-[104px]">
          <div>
            <span className="text-[9px] font-extrabold tracking-[0.14em] text-champagne">
              PRIVATE OPERATIONS WORKSPACE
            </span>
            <h1 className="my-[13px] font-display text-[clamp(32px,4.5vw,46px)] leading-[1.04]">
              A careful place for every future celebration.
            </h1>
            <p className="max-w-[350px] text-[12px] leading-[1.6] text-porcelain/70">
              Sign in to monitor the wishes, payments, and deliveries entrusted to WishDem.
            </p>
            <div className="mt-[26px] max-w-[350px] border-l-2 border-champagne py-1 pl-3 text-[10px] leading-[1.6] text-porcelain/70">
              Your sign-in is protected with two-step verification. Access is available only to
              invited workspace members.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[22px] bg-paper p-[27px] text-ink shadow-deep">
            <h2 className="font-display text-[29px]">Sign in securely</h2>
            <p className="mb-5 mt-[5px] text-[10px] text-ink/60">
              Use your WishDem work account to continue.
            </p>

            <label className="my-3 block">
              <span className="mb-[6px] block text-[9px] font-extrabold">Work email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-3 text-[10px] font-medium text-ink outline-none"
              />
            </label>

            <label className="relative my-3 block">
              <span className="mb-[6px] block text-[9px] font-extrabold">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[42px] w-full rounded-[8px] border border-plum/[0.15] bg-[#FCFCFD] px-3 pr-14 text-[10px] font-medium text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-[10px] top-[34px] text-[8px] font-extrabold text-mulberry"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </label>

            <div className="mt-[15px] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setKeepSignedIn((v) => !v)}
                className="flex items-start gap-[7px] text-left text-[9px] leading-[1.35] text-ink/60"
              >
                <span
                  className={clsxCheck(keepSignedIn)}
                  aria-hidden
                >
                  {keepSignedIn && "✓"}
                </span>
                Keep me signed in for 14 days
                <br />
                on this trusted personal device
              </button>
              <Link to="/forgot-password" className="whitespace-nowrap text-[9px] font-extrabold text-mulberry">
                Forgot password?
              </Link>
            </div>

            {error && <p className="mt-3 text-[11px] text-mulberry">{error}</p>}

            <button
              type="submit"
              disabled={signing}
              className="mt-[19px] w-full rounded-pill bg-plum px-3 py-[12px] text-[10px] font-extrabold text-[#F6F0E8] disabled:opacity-60"
            >
              {signing ? "Signing in…" : "Sign in securely"}
            </button>

            <div className="mt-[15px] border-t border-plum/[0.09] pt-[13px] text-[9px] leading-[1.55] text-ink/57">
              <b className="text-mulberry">Need access?</b> Contact your workspace owner. For the
              safety of wishes, payments, and customer data, verification is required after
              sign-in.
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function clsxCheck(checked: boolean) {
  return `mt-[2px] inline-grid h-[13px] w-[13px] flex-none place-items-center rounded-[3px] border text-[10px] ${
    checked ? "border-mulberry bg-mulberry text-[#F6F0E8]" : "border-mulberry text-mulberry"
  }`;
}
