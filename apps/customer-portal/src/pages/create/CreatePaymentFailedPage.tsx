import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { useWizardStore } from "@/store/wizardStore";
import { formatWeekdayDate } from "@/lib/date";

export default function CreatePaymentFailedPage() {
  const navigate = useNavigate();
  const { recipient, setPaymentPhone } = useWizardStore();

  useEffect(() => {
    if (!recipient) navigate("/create/who", { replace: true });
  }, [recipient, navigate]);

  if (!recipient) return null;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-[790px] rounded-lg border border-champagne/35 bg-plum p-8 text-center shadow-deep sm:p-[52px]">
        <div className="mx-auto grid h-[90px] w-[90px] place-items-center rounded-full border border-champagne font-display text-[18px] text-champagne">
          pause,
          <br />
          not loss
        </div>
        <span className="mt-6 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
          YOUR WISH IS STILL SAFE
        </span>
        <h1 className="my-[14px] font-display text-[clamp(34px,5vw,56px)] leading-[1.05]">
          Payment needs
          <br />
          <i className="italic">another try.</i>
        </h1>
        <p className="mx-auto max-w-[520px] leading-[1.7] text-porcelain/75">
          We could not seal {recipient.name}'s wish just yet. Your letter, look,
          and delivery details are still saved exactly as you left them.
        </p>
        <div className="my-6 flex flex-wrap justify-center gap-6 border-y border-porcelain/[0.13] py-5 text-[12px]">
          <span>
            {recipient.name} · {formatWeekdayDate(recipient.birthdayISO)}
          </span>
          <b className="text-champagne">GH₵1.49</b>
        </div>
        <Button type="button" onClick={() => navigate("/create/seal")}>
          Try payment again
        </Button>
        <button
          type="button"
          onClick={() => {
            setPaymentPhone("");
            navigate("/create/seal");
          }}
          className="mt-[17px] block w-full text-[12px] font-extrabold opacity-80"
        >
          Choose another payment method
        </button>
      </section>
    </main>
  );
}
