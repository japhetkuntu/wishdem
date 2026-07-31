import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { requestOtp } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const result = await requestOtp(email);
    setSending(false);
    navigate("/login/verify", {
      state: {
        email: email.trim().toLowerCase(),
        isNewCustomer: result.isNewCustomer,
        maskedEmail: result.maskedEmail,
      },
    });
  }

  return (
    <main className="mx-auto grid w-full max-w-[1180px] gap-7 px-5 py-6 sm:grid-cols-[1.03fr_.97fr] sm:items-center sm:gap-8 sm:px-8 sm:py-8">
      <section className="flex min-h-0 flex-col justify-between sm:min-h-[610px]">
        <div>
          <Link to="/" className="text-[21px] font-extrabold tracking-[-1.5px]">
            Wish
            <i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
            Dem
          </Link>

          <div className="mt-8 sm:mt-10">
            <span className="text-[10px] font-extrabold tracking-[0.13em] text-champagne">
              YOUR FUTURE CORRESPONDENCE
            </span>
            <h1 className="my-[11px] font-display text-[clamp(38px,5vw,65px)] leading-[1.03] tracking-[-1.6px]">
              Return to what you <i className="text-rose italic">planted.</i>
            </h1>
            <p className="max-w-[430px] text-[14px] leading-[1.65] text-porcelain/72">
              Every wish you write has a quiet place to wait until its moment arrives.
              Sign in to tend the ones you are keeping.
            </p>

            <article className="mt-7 hidden max-w-[390px] rounded-md border border-porcelain/[0.17] bg-porcelain/[0.04] p-[14px] sm:block">
              <small className="text-[9px] font-extrabold tracking-[0.1em] text-champagne">
                KEPT FOR LATER
              </small>
              <h3 className="my-[6px] font-display text-[22px]">Maya's September 14</h3>
              <p className="text-[10px] leading-[1.5] text-porcelain/85">
                A note, a voice memory, and a birthday moment held with care.
              </p>
              <div className="mt-[10px] border-t border-porcelain/[0.13] pt-[9px] text-[10px] text-porcelain/85">
                Your future wishes stay private, until their day to bloom.
              </div>
            </article>
          </div>
        </div>
        <small className="mt-6 text-porcelain/50 sm:mt-0">
          © WishDem · Private by design
        </small>
      </section>

      <section className="w-full rounded-lg bg-porcelain p-6 text-ink shadow-card sm:p-8">
        <span className="text-[9px] font-extrabold tracking-[0.11em] text-mulberry">
          01 · EMAIL ACCESS
        </span>
        <h2 className="my-2 font-display text-[34px] tracking-[-0.7px]">
          Enter your email
        </h2>
        <p className="mb-[22px] text-[12px] leading-[1.55] text-ink/58">
          We will send a six-digit private code. No password to remember, reset, or
          share.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="mb-[6px] block text-[10px] font-extrabold">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-plum/[0.17] bg-white p-[13px] text-[13px] font-semibold text-ink outline-none focus:ring-2 focus:ring-champagne focus:ring-offset-2"
          />
          <Button type="submit" variant="dark" disabled={sending} className="mt-[11px] w-full">
            {sending ? "Sending…" : "Continue with email"}
          </Button>
        </form>

        <div className="mt-[17px] flex items-start gap-2 rounded-sm bg-champagne/[0.17] p-3 text-[10px] leading-[1.5]">
          <span className="mt-1 h-2 w-2 flex-none rounded-full bg-champagne" />
          <span>
            <b>A simple private check.</b>
            <br />
            We use a one-time code to keep your wishes safe without another password.
          </span>
        </div>

        <p className="mt-[18px] text-[10px] leading-[1.55] text-ink/56">
          Already have wishes waiting? Use the email you used to plant them. Need help?{" "}
          <a href="mailto:support@wishdem.example" className="font-extrabold text-mulberry">
            Contact support
          </a>
          .
        </p>

        <div className="mt-[22px] flex justify-between text-[10px]">
          <Link to="/how-it-works" className="font-extrabold text-mulberry">
            How WishDem works
          </Link>
          <Link to="/how-it-works#faq" className="font-extrabold text-mulberry">
            Privacy
          </Link>
        </div>
      </section>
    </main>
  );
}
