import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@wishdem/design-system";
import { CreateLayout } from "@/components/CreateLayout";
import { useWizardStore } from "@/store/wizardStore";
import { getWish, saveWhoStep } from "@/lib/api";
import { daysUntil } from "@/lib/date";
import type { Relationship } from "@/types";

const RELATIONSHIPS: Relationship[] = [
  "Best friend",
  "Partner",
  "Parent",
  "Sibling",
  "Colleague",
  "Friend",
  "Other",
];

const inputClass =
  "w-full bg-transparent text-[14px] font-bold text-porcelain outline-none placeholder:font-normal placeholder:text-porcelain/40 [color-scheme:dark]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-porcelain/10 py-[13px] last:border-0">
      <label className="mb-[6px] block text-[10px] font-extrabold tracking-[0.12em] text-champagne">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CreateWhoPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryWishId = params.get("wishId");
  const { recipient, wishId, setWishId, setRecipient, hydrateFromWish } =
    useWizardStore();

  const [name, setName] = useState(recipient?.name ?? "");
  const [relationship, setRelationship] = useState<Relationship>(
    recipient?.relationship ?? "Best friend",
  );
  const [birthdayISO, setBirthdayISO] = useState(recipient?.birthdayISO ?? "");
  const [deliveryTime, setDeliveryTime] = useState(recipient?.deliveryTime ?? "09:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryWishId && queryWishId !== wishId) {
      getWish(queryWishId).then((wish) => {
        if (!wish) return;
        hydrateFromWish(wish);
        setName(wish.recipient.name);
        setRelationship(wish.recipient.relationship);
        setBirthdayISO(wish.recipient.birthdayISO);
        setDeliveryTime(wish.recipient.deliveryTime);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryWishId]);

  const days = birthdayISO ? daysUntil(birthdayISO) : null;

  async function handleContinue(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthdayISO) return;
    setSaving(true);
    setError(null);
    const rec = {
      name: name.trim(),
      relationship,
      birthdayISO,
      deliveryTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    try {
      const wish = await saveWhoStep({ id: wishId ?? undefined, recipient: rec });
      setWishId(wish.id);
      setRecipient(rec);
      navigate("/create/message");
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateLayout activeIndex={0}>
      <section className="grid gap-6 sm:grid-cols-[1.15fr_.85fr] sm:gap-10">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.14em] text-champagne">
            START WITH THE PERSON
          </span>
          <h1 className="my-3 max-w-[540px] font-display text-[clamp(34px,4.3vw,54px)] leading-[1.05] tracking-[-1.1px]">
            Who deserves a note
            <br />
            from future you?
          </h1>
          <p className="mb-5 max-w-[560px] text-[13px] leading-[1.6] text-porcelain/70">
            Add the person and the moment. You can shape the message next, then
            choose exactly how their birthday wish will arrive.
          </p>

          <form onSubmit={handleContinue}>
            <div className="overflow-hidden rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.04]">
              <header className="flex items-center justify-between border-b border-porcelain/10 px-[18px] py-[14px]">
                <h2 className="font-display text-[21px]">
                  {name ? `${name}'s birthday` : "Their birthday"}
                </h2>
                <span className="text-[10px] font-extrabold tracking-[0.09em] text-champagne">
                  RECIPIENT DETAILS
                </span>
              </header>
              <div className="px-[18px] py-1">
                <Field label="THEIR NAME">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Their name"
                    className={inputClass}
                  />
                </Field>
                <Field label="RELATIONSHIP">
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as Relationship)}
                    className={inputClass}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r} className="bg-plum text-porcelain">
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="BIRTHDAY">
                  <input
                    type="date"
                    value={birthdayISO}
                    onChange={(e) => setBirthdayISO(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>
                <Field label="DELIVERY TIME">
                  <input
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Continue to your message →"}
              </Button>
              <span className="text-[11px] leading-[1.45] text-porcelain/60">
                Nothing is sent yet. Your draft stays in your hands.
              </span>
            </div>
            {error && <p className="mt-3 text-[12px] text-rose">{error}</p>}
          </form>
        </div>

        <aside className="grid gap-[14px]">
          <div className="rounded-lg bg-porcelain p-[18px] text-ink">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
                  {name ? `${name.toUpperCase()}'S NEXT BIRTHDAY` : "NEXT BIRTHDAY"}
                </span>
                <h2 className="font-display text-[28px] leading-[1.06]">
                  {birthdayISO
                    ? new Date(2000, Number(birthdayISO.split("-")[1]) - 1, Number(birthdayISO.split("-")[2])).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long" },
                      )
                    : "Pick a date"}
                </h2>
              </div>
              {days !== null && (
                <div className="text-right font-display text-[34px] leading-none text-mulberry">
                  {days}
                  <small className="mt-1 block font-sans text-[9px] font-extrabold tracking-[0.1em] text-ink">
                    DAYS AWAY
                  </small>
                </div>
              )}
            </div>
            <p className="mt-[13px] text-[12px] leading-[1.55] text-ink/70">
              You have time to make this unforgettable. WishDem will deliver at{" "}
              {deliveryTime || "9:00 AM"} in their local timezone.
            </p>
          </div>

          <div className="rounded-lg bg-mulberry p-[18px]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              A GENTLE START
            </span>
            <h2 className="my-1 font-display text-[25px] leading-[1.15]">
              What do you want {name || "them"} to wake up knowing?
            </h2>
            <p className="text-[12px] leading-[1.6] text-porcelain/75">
              There is no need to get it perfect. Begin with the thing you would
              say if they were sitting beside you.
            </p>
          </div>

          <div className="rounded-lg border border-champagne/45 p-[18px]">
            <span className="mb-1 block text-[10px] font-extrabold tracking-[0.14em] text-champagne">
              DELIVERY CONFIDENCE
            </span>
            <b className="my-1 block text-[12px]">
              Their birthday, their timezone, your private wish.
            </b>
            <p className="text-[11px] leading-[1.5] text-porcelain/65">
              You will choose the delivery channel and preview the unopened
              message before you seal it.
            </p>
          </div>
        </aside>
      </section>
    </CreateLayout>
  );
}
