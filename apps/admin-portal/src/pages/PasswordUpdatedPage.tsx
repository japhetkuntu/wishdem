import { Link, useLocation, useNavigate } from "react-router-dom";

export default function PasswordUpdatedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/login";

  return (
    <main className="min-h-screen w-full bg-midnight text-porcelain">
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-7">
        <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.12]">
          <span className="text-[21px] font-extrabold tracking-[-1.4px]">
            Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
            Dem
          </span>
        </nav>

        <section className="mx-auto my-[64px] max-w-[510px] text-center sm:my-[104px]">
          <div className="mx-auto mb-[17px] grid h-[54px] w-[54px] place-items-center rounded-full bg-champagne text-[24px] font-extrabold text-plum shadow-deep">
            ✓
          </div>
          <h1 className="font-display text-[clamp(32px,4vw,38px)]">Your password has been updated</h1>
          <p className="mx-auto my-2 max-w-[390px] text-[11px] leading-[1.55] text-porcelain/70">
            Your account is protected with your new password. We've signed out your other devices
            to help keep it that way.
          </p>

          <div className="rounded-md bg-paper p-4 text-left text-ink shadow-deep">
            <div className="text-[9px] leading-[1.5]">
              <b className="block text-[10px] text-plum">Other devices signed out</b>
              <span className="text-ink/60">
                Any other browser or phone will need your new password to sign in again.
              </span>
            </div>
            <div className="border-t border-plum/[0.09] py-[10px] text-[9px] leading-[1.5]">
              <b className="block text-[10px] text-plum">Your future wishes are unchanged</b>
              <span className="text-ink/60">
                Scheduled wishes, recipients, payment history, and delivery dates remain exactly
                as you planned them.
              </span>
            </div>
            <div className="border-t border-plum/[0.09] pt-[10px] text-[9px] leading-[1.5]">
              <b className="block text-[10px] font-extrabold text-moss">Password changed just now</b>
              <span className="text-ink/60">
                This security event is now visible in Account &amp; Security.
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="rounded-pill bg-champagne px-[14px] py-[11px] text-[9px] font-extrabold text-plum"
            >
              Return to Account &amp; Security
            </button>
            <Link to="/overview" className="text-[9px] font-extrabold text-champagne">
              Go to your wishes
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
