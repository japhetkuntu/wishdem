import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { OtpInput } from "@/components/OtpInput";
import { useCountdown } from "@/hooks/useCountdown";
import { useWishes } from "@/hooks/useWishes";
import { requestOtp, verifyOtp } from "@/lib/api";
import { daysUntil } from "@/lib/date";
import { formatCountdown } from "@/lib/format";
import { resumeAfterAuth } from "@/lib/resumeGuestDraft";

interface VerifyLocationState {
  email: string;
  isNewCustomer: boolean;
  maskedEmail: string;
}

function BrandHeader() {
  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="text-[21px] font-extrabold tracking-[-1.5px]">
        Wish
        <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
        Dem
      </Link>
      <Link to="/login" className="text-[11px] text-porcelain/65">
        Use a different email
      </Link>
    </header>
  );
}

export default function VerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as VerifyLocationState | null;

  const [name, setName] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const { seconds, reset, isDone } = useCountdown(24);
  const { wishes } = useWishes();

  useEffect(() => {
    if (!state?.email) navigate("/login", { replace: true });
  }, [state, navigate]);

  const nextToBloom = useMemo(() => {
    const sealed = (wishes ?? []).filter((w) => w.status === "sealed");
    if (sealed.length === 0) return null;
    return sealed.reduce((soonest, w) =>
      daysUntil(w.recipient.birthdayISO) < daysUntil(soonest.recipient.birthdayISO)
        ? w
        : soonest,
    );
  }, [wishes]);

  if (!state?.email) return null;

  const complete = code.every((d) => d !== "") && (!state.isNewCustomer || name.trim());

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!complete || !state) return;
    setVerifying(true);
    await verifyOtp(state.email, code.join(""), state.isNewCustomer ? name : undefined);
    setVerifying(false);
    await resumeAfterAuth(navigate);
  }

  async function handleResend() {
    if (!state) return;
    await requestOtp(state.email);
    reset();
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-8">
      <BrandHeader />

      <div className="grid gap-6 py-9 sm:grid-cols-[1fr_.8fr] sm:items-center sm:gap-5 sm:py-12">
        {state.isNewCustomer ? (
          <section className="p-0 sm:p-[21px]">
            <div className="mb-6 grid h-[60px] w-[60px] place-items-center rounded-full bg-champagne text-center font-display text-[12px] leading-[1.1] text-plum">
              a place
              <br />
              to bloom
            </div>
            <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">
              YOUR FIRST PRIVATE DESK
            </span>
            <h1 className="my-[7px] font-display text-[42px] leading-[1.08] tracking-[-1px]">
              A thoughtful birthday starts long before the date.
            </h1>
            <p className="max-w-[350px] text-[12px] leading-[1.6] text-porcelain/68">
              Write it while the feeling is here. WishDem will keep your message safely
              until the moment it matters.
            </p>
            <div className="mt-5 border-l-2 border-champagne py-2 pl-[11px] text-[10px] leading-[1.5] text-porcelain/65">
              After this, you can plant your first future wish—no long profile form, no
              password to create.
            </div>
          </section>
        ) : (
          <section className="hidden rounded-lg border border-porcelain/[0.16] bg-mulberry p-[23px] text-porcelain [--wd-ink-on-canvas-rgb:246_240_232] sm:block">
            <div className="mb-[23px] grid h-[52px] w-[52px] place-items-center rounded-full bg-champagne text-center font-display text-[10px] leading-[1.1] text-plum">
              kept
              <br />
              for you
            </div>
            <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">
              RETURNING TO YOUR DESK
            </span>
            <h2 className="my-[5px] mb-[11px] font-display text-[29px] leading-[1.1]">
              The wishes you planted are still waiting for their day.
            </h2>
            <p className="text-[11px] leading-[1.55] text-porcelain/72">
              We only show this small reminder after you have started signing in with
              your own email.
            </p>
            {nextToBloom && (
              <div className="mt-[19px] rounded-md bg-porcelain/[0.07] p-[13px]">
                <span className="block text-[9px] font-extrabold tracking-[0.1em] text-champagne">
                  NEXT TO BLOOM
                </span>
                <b className="mt-1 block text-[13px]">
                  A wish in {daysUntil(nextToBloom.recipient.birthdayISO)} days
                </b>
                <small className="text-[10px] text-porcelain/70">
                  Scheduled privately · delivery details available after verification
                </small>
              </div>
            )}
            <Link
              to="/dashboard"
              className="mt-[15px] block text-[10px] font-extrabold text-champagne"
            >
              A small moment of care is waiting →
            </Link>
          </section>
        )}

        <section className="w-full rounded-lg bg-paper p-6 text-ink shadow-card sm:p-7">
          {state.isNewCustomer ? (
            <span className="text-[9px] font-extrabold tracking-[0.13em] text-mulberry">
              02 · MAKE IT YOURS
            </span>
          ) : (
            <span className="text-[9px] font-extrabold tracking-[0.13em] text-mulberry">
              02 · PRIVATE CODE
            </span>
          )}

          <h1 className="my-[7px] font-display text-[32px] tracking-[-0.6px] sm:text-[38px]">
            {state.isNewCustomer ? "Let's make this yours" : "Check your inbox"}
          </h1>

          <p className="mb-[19px] text-[12px] leading-[1.55] text-ink/58">
            {state.isNewCustomer ? (
              <>
                First, confirm the code sent to <b className="text-plum">{state.maskedEmail}</b>.
                Then your correspondence desk is ready.
              </>
            ) : (
              <>
                We sent a six-digit code to <b className="text-plum">{state.maskedEmail}</b>.
                This keeps your wishes private without another password to remember.
              </>
            )}
          </p>

          <form onSubmit={handleVerify}>
            {state.isNewCustomer && (
              <>
                <label htmlFor="name" className="mb-[6px] block text-[10px] font-extrabold">
                  Your name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="e.g. Amara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-plum/[0.19] bg-white p-3 text-[13px] font-medium text-plum outline-none focus:border-2 focus:border-champagne"
                />
                <p className="mb-[14px] mt-[5px] text-[9px] text-ink/55">
                  A preferred name is perfect. It makes future correspondence feel
                  personal.
                </p>
                <label className="mb-[6px] block text-[10px] font-extrabold">
                  Your six-digit code
                </label>
              </>
            )}

            <OtpInput values={code} onChange={setCode} />

            {state.isNewCustomer ? (
              <div className="mb-[17px] mt-[6px] text-[10px] text-ink/58">
                A fresh code can be requested in{" "}
                <b className="text-mulberry">{formatCountdown(seconds)}</b>
                {isDone && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-extrabold text-mulberry underline"
                    >
                      Resend
                    </button>
                  </>
                )}
                {" · "}
                <a href="mailto:support@wishdem.example" className="font-extrabold text-mulberry">
                  Need help?
                </a>
              </div>
            ) : (
              <div className="mb-[18px] mt-1 flex justify-between gap-3 text-[10px] text-ink/58 sm:items-center">
                <span>
                  You can request a new code in{" "}
                  <b className="text-mulberry">{formatCountdown(seconds)}</b>
                  {isDone && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={handleResend}
                        className="font-extrabold text-mulberry underline"
                      >
                        Resend
                      </button>
                    </>
                  )}
                </span>
                <span>Paste a full code anytime</span>
              </div>
            )}

            <Button
              type="submit"
              variant="dark"
              disabled={!complete || verifying}
              className="w-full"
            >
              {verifying
                ? "Verifying…"
                : state.isNewCustomer
                  ? "Create my WishDem"
                  : "Verify and return to my wishes"}
            </Button>
          </form>

          {state.isNewCustomer ? (
            <>
              <div className="mt-[15px] flex gap-[9px] rounded-md bg-champagne/[0.12] p-[10px] text-[9px] leading-[1.5] text-ink/60">
                <i className="mt-[3px] h-2 w-2 flex-none rounded-full bg-champagne" />
                <span>
                  <b>Private by design.</b>
                  <br />
                  Your name and email create a personal place for future wishes—nothing
                  more is needed right now.
                </span>
              </div>
              <p className="mt-[14px] text-center text-[10px] text-ink/58">
                Already have an account?{" "}
                <Link to="/login" className="font-extrabold text-mulberry">
                  Use a different email
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <div className="mt-[15px] text-center text-[10px] text-ink/58">
                <a href="mailto:" className="font-extrabold text-mulberry">
                  Open email app
                </a>{" "}
                ·{" "}
                <Link to="/login" className="font-extrabold text-mulberry">
                  Use a different email
                </Link>
              </div>
              <div className="mt-[18px] border-t border-plum/[0.1] pt-[14px] text-[10px] text-ink/58">
                Didn't receive it? Check your spam folder, then{" "}
                <a href="mailto:support@wishdem.example" className="font-extrabold text-mulberry">
                  get help
                </a>
                . When resend is available, your earlier code will no longer work.
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
