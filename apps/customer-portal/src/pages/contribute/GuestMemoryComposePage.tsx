import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { useContributionContext, useMemoryDraft } from "@/hooks/useContribution";
import { ImagePanel, VideoPanel, VoicePanel } from "@/components/AttachmentPicker";
import type { Attachment, MemoryFormat } from "@/types";

const PROMPTS = ["I'll never forget when…", "You are at your best when…", "One thing you gave me…"];

const FORMAT_LABELS: Record<MemoryFormat, string> = {
  notes: "YOUR NOTE",
  photo: "YOUR PHOTO",
  voice: "YOUR VOICE NOTE",
  video: "YOUR VIDEO",
};

export default function GuestMemoryComposePage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [format, setFormat] = useState<MemoryFormat>((params.get("type") as MemoryFormat) || "notes");
  const { context } = useContributionContext(id);
  const { memory, save } = useMemoryDraft(id);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [whenWhere, setWhenWhere] = useState("");
  const [contributorLabel, setContributorLabel] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title ?? "");
      setBody(memory.body);
      setWhenWhere(memory.whenWhere ?? "");
      setContributorLabel(memory.contributorLabel);
      setAttachment(memory.attachment ?? null);
      setFormat(memory.format);
    }
  }, [memory]);

  function insertPrompt(prompt: string) {
    setBody((prev) => (prev ? `${prev}\n\n${prompt} ` : `${prompt} `));
  }

  function switchMediaMode(next: "voice" | "video") {
    if (next === format) return;
    setFormat(next);
    setAttachment(null);
  }

  async function handlePreview() {
    if (!id) return;
    await save({
      format,
      title: title.trim() || undefined,
      body,
      whenWhere: whenWhere.trim() || undefined,
      contributorLabel: contributorLabel.trim(),
      attachment,
    });
    setSavedAt(Date.now());
    navigate(`/contribute/${id}/preview`);
  }

  const recipientFirst = context?.recipientName.split(" ")[0] ?? "them";
  const isMedia = format === "voice" || format === "video";
  const canSubmit = isMedia || format === "photo" ? !!attachment && contributorLabel.trim() : body.trim() && contributorLabel.trim();

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-9 sm:px-8">
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.4px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <Link to={`/contribute/${id}`} className="ml-7 text-[10px] text-porcelain/70">
          ← Change memory type
        </Link>
        <div className="flex-1" />
        <span className="text-[9px] text-porcelain/68">
          <b className="text-champagne">{savedAt ? "Saved" : "Not saved yet"}</b>
          {savedAt ? " just now" : ""}
        </span>
      </nav>

      <header className="py-[25px] pb-[17px]">
        <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">
          {context ? `${context.title.toUpperCase()} · ` : ""}
          {FORMAT_LABELS[format]}
        </span>
        {format === "photo" ? (
          <>
            <h1 className="my-[6px] font-display text-[38px] leading-[1.05]">
              Give this photo its place in {recipientFirst}'s story.
            </h1>
            <p className="text-[11px] text-porcelain/68">
              One image, a little context, and the part only you remember.
            </p>
          </>
        ) : isMedia ? (
          <>
            <h1 className="my-[6px] font-display text-[38px] leading-[1.05]">Let {recipientFirst} hear your voice.</h1>
            <p className="text-[11px] text-porcelain/68">
              Record a warm message from wherever you are. It will play as one private card in{" "}
              {context?.title ?? "the keepsake"}.
            </p>
          </>
        ) : (
          <>
            <h1 className="my-[6px] font-display text-[38px] leading-[1.05]">A small true thing is enough.</h1>
            <p className="text-[11px] text-porcelain/68">
              This will become one card in {recipientFirst}'s keepsake. You can edit it until the
              collection closes{context ? ` (${context.collectionClosesLabel})` : ""}.
            </p>
          </>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_295px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePreview();
          }}
          className="rounded-[14px] bg-porcelain p-[22px] text-ink shadow-card"
        >
          {format === "notes" && (
            <>
              <label className="mt-[13px] block text-[10px] font-extrabold">
                Give this memory a title <em className="font-medium text-ink/50">(optional)</em>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The night of the yellow umbrella"
                className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
              />

              <label className="mt-[13px] block text-[10px] font-extrabold">Your memory</label>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share a story, a habit, a laugh — whatever feels like them."
                className="mt-[6px] h-[213px] w-full resize-none rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium leading-[1.7] text-ink outline-none"
              />
              <div className="mt-[6px] text-[9px] text-ink/58">
                A few honest lines are enough. Your words do not need to be perfect.
              </div>

              <div className="mt-[10px] flex flex-wrap gap-[6px]">
                {PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => insertPrompt(prompt)}
                    className="rounded-pill border border-plum/[0.14] px-[9px] py-[7px] text-[9px] font-bold text-mulberry"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-[10px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold">
                    When or where <em className="font-medium text-ink/50">(optional)</em>
                  </label>
                  <input
                    value={whenWhere}
                    onChange={(e) => setWhenWhere(e.target.value)}
                    placeholder="e.g. Autumn 2019 · Edinburgh"
                    className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold">
                    How should {recipientFirst} know you?
                  </label>
                  <input
                    required
                    value={contributorLabel}
                    onChange={(e) => setContributorLabel(e.target.value)}
                    placeholder="e.g. Priya · kitchen co-conspirator"
                    className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {format === "photo" && (
            <>
              <ImagePanel value={attachment} onChange={setAttachment} />
              <label className="mt-[13px] block text-[10px] font-extrabold">Memory title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The first dinner we burned"
                className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
              />
              <label className="mt-[13px] block text-[10px] font-extrabold">Why this photo matters</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's happening in the photo, and why it still matters to you."
                className="mt-[6px] h-[105px] w-full resize-none rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium leading-[1.6] text-ink outline-none"
              />
              <div className="mt-[10px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold">When or where</label>
                  <input
                    value={whenWhere}
                    onChange={(e) => setWhenWhere(e.target.value)}
                    placeholder="e.g. 2017 · Dalston"
                    className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold">Signed by</label>
                  <input
                    required
                    value={contributorLabel}
                    onChange={(e) => setContributorLabel(e.target.value)}
                    placeholder="e.g. Priya · former roommate"
                    className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {isMedia && (
            <>
              <div className="flex gap-[7px]">
                <button
                  type="button"
                  onClick={() => switchMediaMode("voice")}
                  className={clsx(
                    "rounded-pill border px-[10px] py-[7px] text-[9px] font-extrabold",
                    format === "voice" ? "border-mulberry bg-mulberry text-porcelain" : "border-plum/15 text-ink/70",
                  )}
                >
                  Voice note · up to 30 sec
                </button>
                <button
                  type="button"
                  onClick={() => switchMediaMode("video")}
                  className={clsx(
                    "rounded-pill border px-[10px] py-[7px] text-[9px] font-extrabold",
                    format === "video" ? "border-mulberry bg-mulberry text-porcelain" : "border-plum/15 text-ink/70",
                  )}
                >
                  Short video · up to 30 sec
                </button>
              </div>
              <div className="mt-3">
                {format === "voice" ? (
                  <VoicePanel value={attachment} onChange={setAttachment} />
                ) : (
                  <VideoPanel value={attachment} onChange={setAttachment} />
                )}
              </div>
              <label className="mt-[13px] block text-[10px] font-extrabold">
                A small caption <em className="font-medium text-ink/50">(optional)</em>
              </label>
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. For the person who always answers the phone."
                className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
              />
              <label className="mt-[13px] block text-[10px] font-extrabold">Signed by</label>
              <input
                required
                value={contributorLabel}
                onChange={(e) => setContributorLabel(e.target.value)}
                placeholder="e.g. David · Dad"
                className="mt-[6px] w-full rounded-[8px] border border-plum/[0.12] bg-[#F9F9FB] px-3 py-[11px] text-[11px] font-medium text-ink outline-none"
              />
            </>
          )}

          <div className="mt-[17px] flex flex-col items-start gap-3 border-t border-plum/10 pt-[15px] sm:flex-row sm:items-center sm:justify-between">
            <small className="text-[9px] leading-[1.5] text-ink/58">
              Your private draft is saved in this invitation.
              <br />
              Send yourself a return link to keep it safe elsewhere.
            </small>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-pill bg-plum px-[15px] py-[11px] text-[10px] font-extrabold text-porcelain disabled:opacity-45"
            >
              Preview memory
            </button>
          </div>
        </form>

        <aside className="rounded-[14px] border border-porcelain/[0.14] p-[17px]">
          {format === "notes" ? (
            <>
              <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">A QUIET NUDGE</span>
              <h2 className="my-[7px] font-display text-[25px]">Write what only you could say.</h2>
              <p className="text-[10px] leading-[1.55] text-porcelain/68">
                Small details make a keepsake feel alive: a place, a habit, a laugh, the thing{" "}
                {recipientFirst} made easier.
              </p>
              <div className="mt-3 rounded-[10px] bg-mulberry p-3 text-[10px] leading-[1.55] text-porcelain/78">
                <b className="mb-1 block text-[9px] text-champagne">AN EXAMPLE</b>
                "You turned my first week on the team into something I could belong to. I still
                remember you saving me a seat at lunch."
              </div>
            </>
          ) : format === "photo" ? (
            <>
              <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">A PIECE OF THE KEEPSAKE</span>
              <h2 className="my-[7px] font-display text-[25px]">A photo is more than an attachment.</h2>
              <p className="text-[10px] leading-[1.55] text-porcelain/68">
                It will appear with your title, story, and signature as one complete card in{" "}
                {context?.title ?? "the keepsake"}.
              </p>
            </>
          ) : (
            <>
              <span className="text-[9px] font-extrabold tracking-[0.12em] text-champagne">A MOMENT OF PRESENCE</span>
              <h2 className="my-[7px] font-display text-[25px]">Simple is powerful.</h2>
              <p className="text-[10px] leading-[1.55] text-porcelain/68">
                A few spoken words are enough. You can record from your kitchen, your commute, or
                half a world away.
              </p>
            </>
          )}
          <div className="border-t border-porcelain/[0.13] py-3 text-[9px] leading-[1.5] text-porcelain/64">
            <b className="block text-[10px] text-porcelain">
              Only {recipientFirst} {isMedia ? "hears" : "sees"} it
            </b>
            Your {isMedia ? "audio or video" : "words"} stay{isMedia ? "s" : ""} sealed until{" "}
            {context?.deliveredLabel ?? "delivery"}.
          </div>
          <div className="border-t border-porcelain/[0.13] py-3 text-[9px] leading-[1.5] text-porcelain/64">
            <b className="block text-[10px] text-porcelain">
              {format === "photo" ? "Your words remain yours" : "Need a second try?"}
            </b>
            {format === "photo"
              ? `${context?.inviterName ?? "The organizer"} may arrange cards or request a revision, but cannot silently rewrite your memory.`
              : "Listen first, then re-record as many times as you need. Nothing is shared until you seal it."}
          </div>
          <span className="mt-2 block text-[9px] font-extrabold text-champagne">
            Email me a secure return link
          </span>
        </aside>
      </section>
    </main>
  );
}
