import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { AppNav } from "@/components/AppNav";
import { useCircle } from "@/hooks/useCircle";
import { daysUntil } from "@/lib/date";

const RELATIONSHIPS = ["Partner", "Family", "Friend", "Colleague", "Other"];

export default function AddPersonPage() {
  const navigate = useNavigate();
  const { addPerson } = useCircle();

  const [name, setName] = useState("");
  const [birthdayISO, setBirthdayISO] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [relationship, setRelationship] = useState("Friend");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = birthdayISO ? daysUntil(birthdayISO) : null;

  function resetForm() {
    setName("");
    setBirthdayISO("");
    setNote("");
    setRelationship("Friend");
  }

  async function submitPerson(addAnother: boolean) {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addPerson({
        name: name.trim(),
        birthdayISO: birthdayISO || null,
        timezone,
        relationshipLabel: relationship,
        note: note.trim() || undefined,
      });
      if (addAnother) {
        resetForm();
      } else {
        navigate("/circle");
      }
    } catch {
      setError("We couldn't save that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 pb-[104px] pt-6 sm:px-8 sm:pb-9">
      <AppNav active="circle" />

      <section className="grid gap-8 py-8 sm:grid-cols-[.85fr_1.15fr] sm:items-center sm:gap-14 sm:py-12">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-champagne">
            A SMALL ACT OF REMEMBERING
          </span>
          <h1 className="my-[10px] font-display text-[clamp(32px,4vw,48px)] leading-[1.04]">
            Bring someone you care about into your Circle.
          </h1>
          <p className="max-w-[330px] text-[12px] leading-[1.6] text-porcelain/68">
            A name, a birthday, and one detail worth keeping are enough to make
            the future feel more considered.
          </p>
          <div className="mt-6 flex gap-[6px]">
            <i className="block h-[3px] w-[38px] rounded-pill bg-champagne" />
            <i className="block h-[3px] w-[38px] rounded-pill bg-porcelain/[0.18]" />
            <i className="block h-[3px] w-[38px] rounded-pill bg-porcelain/[0.18]" />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitPerson(false);
          }}
          className="rounded-lg bg-paper p-6 text-ink shadow-card"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="font-display text-[26px]">Who would you like to remember?</h2>
            <span className="max-w-[145px] text-right text-[9px] leading-[1.4] text-ink/60">
              Private to you unless you choose to share a wish later.
            </span>
          </div>

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            THEIR NAME
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maya Chen"
            className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
          />

          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-[1fr_.8fr]">
            <div>
              <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
                BIRTHDAY
              </label>
              <input
                type="date"
                value={birthdayISO}
                onChange={(e) => setBirthdayISO(e.target.value)}
                className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
                TIME ZONE
              </label>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Europe/London"
                className="w-full rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
              />
            </div>
          </div>

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            HOW DO YOU KNOW THEM?
          </label>
          <div className="flex flex-wrap gap-[6px]">
            {RELATIONSHIPS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRelationship(option)}
                className={clsx(
                  "rounded-pill border border-plum/[0.15] px-[10px] py-2 text-[9px] font-extrabold",
                  relationship === option ? "border-mulberry bg-mulberry text-[#F6F0E8]" : "text-ink/70",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="mb-[6px] mt-[15px] block text-[9px] font-extrabold tracking-[0.08em]">
            A DETAIL WORTH KEEPING{" "}
            <span className="font-medium text-ink/50">· optional</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A gift idea, a small joy, or something to remember when their day comes around."
            rows={3}
            className="w-full resize-none rounded-sm border border-plum/[0.13] bg-background px-3 py-[11px] text-[12px] font-semibold text-ink outline-none"
          />
          <p className="my-[5px] text-[9px] text-ink/55">
            A gift idea, a small joy, or something you want to remember when their
            day comes around.
          </p>

          {name && days !== null && (
            <div className="mt-[13px] rounded-md bg-plum/[0.045] p-[10px] text-[10px]">
              <strong className="block text-[10px]">
                {name}'s birthday is in {days} days.
              </strong>
              <span className="text-ink/60">
                We'll help you begin a wish when you are ready.
              </span>
            </div>
          )}

          {error && <p className="mt-3 text-[12px] text-mulberry">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-[9px]">
            <Button type="submit" variant="dark" size="sm" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : `Add ${name.trim() || "them"} to my Circle`}
            </Button>
            <Button
              type="button"
              variant="outline-inverse"
              size="sm"
              disabled={saving || !name.trim()}
              onClick={() => submitPerson(true)}
            >
              Add another
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
