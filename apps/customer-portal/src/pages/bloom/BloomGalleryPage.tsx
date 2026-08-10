import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { useBirthdayBloom } from "@/hooks/useBirthdayBloom";
import type { BloomWish } from "@/types";

type FilterKey = "all" | "unread" | "favorites" | "note" | "photo" | "voice" | "video";

const TYPE_LABELS: Record<BloomWish["type"], string> = {
  note: "WRITTEN MEMORY",
  "photo-note": "PHOTO + NOTE",
  "photo-memory": "PHOTO MEMORY",
  voice: "VOICE",
  video: "VIDEO",
};

const UNOPENED_TYPE_LABELS: Record<BloomWish["type"], string> = {
  note: "SEALED NOTE",
  "photo-note": "SEALED NOTE",
  "photo-memory": "PHOTO MEMORY",
  voice: "SEALED VOICE NOTE",
  video: "SEALED VIDEO",
};

const UNOPENED_TEASERS: Record<BloomWish["type"], string> = {
  note: "A letter is waiting for you.",
  "photo-note": "A note and photo are waiting for you.",
  "photo-memory": "One image and a story are waiting.",
  voice: "A voice message is waiting for you.",
  video: "A short video is waiting for you.",
};

function GalleryCard({
  wish,
  onOpen,
  onToggleFavorite,
}: {
  wish: BloomWish;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  const isMedia = wish.type === "voice" || wish.type === "video";

  if (!wish.opened) {
    return (
      <button
        type="button"
        onClick={onOpen}
        id={`bloom-${wish.id}`}
        className="min-h-[176px] rounded-[14px] border border-dashed border-champagne/50 bg-transparent p-[14px] text-left text-porcelain"
      >
        <span className="text-[8px] font-extrabold tracking-[0.1em] text-porcelain/65">
          {UNOPENED_TYPE_LABELS[wish.type]}
        </span>
        <h3 className="my-[24px] font-display text-[17px]">{wish.contributorName}</h3>
        <p className="text-[10px] leading-[1.5] text-porcelain/65">{UNOPENED_TEASERS[wish.type]}</p>
        <span className="mt-3 block text-[9px] font-extrabold text-porcelain/60">
          {wish.relationshipLabel} · unopened
        </span>
      </button>
    );
  }

  return (
    <article
      id={`bloom-${wish.id}`}
      className={clsx(
        "relative min-h-[176px] rounded-[14px] p-[14px] shadow-[0_8px_20px_rgba(13,6,14,0.14)]",
        isMedia ? "bg-mulberry text-[#F6F0E8]" : "bg-paper text-ink",
      )}
    >
      <span className={clsx("text-[8px] font-extrabold tracking-[0.1em]", isMedia ? "text-champagne" : "text-mulberry")}>
        {TYPE_LABELS[wish.type]}
        {wish.mediaDurationSeconds ? ` · ${Math.floor(wish.mediaDurationSeconds / 60)}:${String(wish.mediaDurationSeconds % 60).padStart(2, "0")}` : ""}
      </span>
      <button
        type="button"
        onClick={onToggleFavorite}
        className={clsx(
          "absolute right-3 top-[11px] text-[16px]",
          wish.favorited ? "text-rose" : isMedia ? "text-porcelain/30" : "text-ink/20",
        )}
        aria-label={wish.favorited ? "Remove from favorites" : "Keep close"}
      >
        ♥
      </button>
      <h3 className="my-[24px] font-display text-[21px]">{wish.contributorName}</h3>
      <p className={clsx("text-[10px] leading-[1.5]", isMedia ? "text-porcelain/75" : "text-ink/68")}>{wish.quote}</p>
      <span className="mt-3 block text-[9px] font-extrabold">
        {wish.relationshipLabel} · {isMedia ? (wish.type === "voice" ? "listen again" : "play") : "opened"}
      </span>
    </article>
  );
}

export default function BloomGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { bloom, loading, markOpened, toggleFavorite } = useBirthdayBloom(id);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [thanked, setThanked] = useState(false);
  const [archived, setArchived] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (params.get("reveal") !== "1" || revealed || !bloom) return;
    const firstUnopened = bloom.wishes.find((w) => !w.opened);
    if (firstUnopened) {
      markOpened(firstUnopened.id);
      setTimeout(() => {
        document.getElementById(`bloom-${firstUnopened.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
    setRevealed(true);
  }, [params, revealed, bloom, markOpened]);

  const filtered = useMemo(() => {
    if (!bloom) return [];
    let list = bloom.wishes;
    if (filter === "unread") list = list.filter((w) => !w.opened);
    if (filter === "favorites") list = list.filter((w) => w.favorited);
    if (filter === "note") list = list.filter((w) => w.type === "note" || w.type === "photo-note");
    if (filter === "photo") list = list.filter((w) => w.type === "photo-note" || w.type === "photo-memory");
    if (filter === "voice") list = list.filter((w) => w.type === "voice");
    if (filter === "video") list = list.filter((w) => w.type === "video");
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (w) => w.contributorName.toLowerCase().includes(query) || w.quote?.toLowerCase().includes(query),
      );
    }
    return list;
  }, [bloom, filter, search]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-9 sm:px-8">
        <p className="py-16 text-center text-[12px] text-porcelain/55">Loading…</p>
      </main>
    );
  }

  if (!bloom) {
    return (
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-9 sm:px-8">
        <p className="py-16 text-center text-[12px] text-porcelain/55">
          Nothing has been gathered here yet.
        </p>
      </main>
    );
  }

  const openedCount = bloom.wishes.filter((w) => w.opened).length;
  const favoritedCount = bloom.wishes.filter((w) => w.favorited).length;
  const waitingCount = bloom.wishes.length - openedCount;
  const familyWishes = filtered.filter((w) => w.group === "family");
  const friendWishes = filtered.filter((w) => w.group === "friends");

  const counts = {
    all: bloom.wishes.length,
    unread: waitingCount,
    favorites: favoritedCount,
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-10 sm:px-8">
      <nav className="flex min-h-[68px] items-center border-b border-porcelain/[0.15]">
        <Link to="/" className="text-[21px] font-extrabold tracking-[-1.3px]">
          Wish<i className="mx-[2px] mb-[7px] inline-block h-[6px] w-[6px] rounded-full bg-champagne align-middle" />
          Dem
        </Link>
        <Link to={`/bloom/${id}`} className="ml-6 text-[10px] text-porcelain/70">
          {bloom.recipientName}'s Birthday Bloom
        </Link>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setThanked(true)}
          className="rounded-pill bg-champagne px-[12px] py-[10px] text-[9px] font-extrabold text-plum"
        >
          {thanked ? "Thanks sent ✓" : `Thank ${bloom.organizerName.split(" ")[0]}'s people`}
        </button>
      </nav>

      <header className="py-6 pb-[16px]">
        <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">
          ALL WISHES · {bloom.wishes.length} CONTRIBUTIONS
        </span>
        <h1 className="my-[7px] font-display text-[clamp(28px,4vw,36px)]">
          {bloom.wishes.length} pieces of your story, kept for today.
        </h1>
        <p className="text-[10px] text-porcelain/68">
          {bloom.wishes.filter((w) => w.type === "note" || w.type === "photo-note").length} notes ·{" "}
          {bloom.wishes.filter((w) => w.type === "photo-note" || w.type === "photo-memory").length} photos ·{" "}
          {bloom.wishes.filter((w) => w.type === "voice").length} voice message
          {bloom.wishes.filter((w) => w.type === "voice").length === 1 ? "" : "s"} ·{" "}
          {bloom.wishes.filter((w) => w.type === "video").length} video · Open at your own pace, return
          whenever you wish.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-[7px] rounded-[14px] bg-paper p-3 text-ink">
        {(
          [
            { key: "all", label: "All wishes" },
            { key: "unread", label: `Unread · ${counts.unread}` },
            { key: "favorites", label: `Favorites · ${counts.favorites}` },
            { key: "note", label: "Notes" },
            { key: "photo", label: "Photos" },
            { key: "voice", label: "Voice" },
            { key: "video", label: "Video" },
          ] as { key: FilterKey; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={clsx(
              "whitespace-nowrap rounded-pill border border-plum/[0.13] px-[9px] py-[7px] text-[9px] font-extrabold",
              filter === f.key ? "bg-mulberry text-[#F6F0E8]" : "text-ink/75",
            )}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a person or memory"
          className="ml-auto min-w-[180px] rounded-pill border border-plum/[0.11] px-[11px] py-[7px] text-[9px] text-ink/70 outline-none"
        />
      </section>

      <section className="mt-[17px] grid gap-[17px] sm:grid-cols-[minmax(0,1fr)_210px]">
        <div>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-porcelain/55">
              No wishes match that filter yet.
            </p>
          ) : (
            <>
              {familyWishes.length > 0 && (
                <section className="mb-[22px]">
                  <h2 className="mb-[9px] font-display text-[25px]">From your family</h2>
                  <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
                    {familyWishes.map((w) => (
                      <GalleryCard
                        key={w.id}
                        wish={w}
                        onOpen={() => markOpened(w.id)}
                        onToggleFavorite={() => toggleFavorite(w.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {friendWishes.length > 0 && (
                <section className="mb-[22px]">
                  <h2 className="mb-[9px] font-display text-[25px]">From your friends</h2>
                  <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
                    {friendWishes.map((w) => (
                      <GalleryCard
                        key={w.id}
                        wish={w}
                        onOpen={() => markOpened(w.id)}
                        onToggleFavorite={() => toggleFavorite(w.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="h-max rounded-[14px] border border-porcelain/[0.15] p-[15px]">
          <span className="text-[9px] font-extrabold tracking-[0.13em] text-champagne">YOUR BLOOM</span>
          <h2 className="my-[6px] font-display text-[23px]">Nothing is lost.</h2>
          <p className="text-[9px] leading-[1.5] text-porcelain/68">
            Every message remains here for you to reread, replay, and keep close.
          </p>
          <div className="border-t border-porcelain/[0.13] py-3">
            <b className="text-[18px] text-champagne">
              {openedCount} / {bloom.wishes.length}
            </b>
            <span className="block text-[9px] text-porcelain/68">wishes opened so far</span>
          </div>
          <div className="border-t border-porcelain/[0.13] py-3">
            <b className="text-[18px] text-champagne">{favoritedCount}</b>
            <span className="block text-[9px] text-porcelain/68">wishes kept close</span>
          </div>
          <div className="border-t border-porcelain/[0.13] py-3">
            <b className="text-[18px] text-champagne">{waitingCount}</b>
            <span className="block text-[9px] text-porcelain/68">still waiting, without hurry</span>
          </div>
          <button
            type="button"
            onClick={() => setArchived(true)}
            className="w-full rounded-pill bg-porcelain/[0.08] px-[10px] py-[10px] text-[9px] font-extrabold text-porcelain"
          >
            {archived ? "Saved to your archive ✓" : "Keep this Birthday Bloom"}
          </button>
        </aside>
      </section>
    </main>
  );
}
