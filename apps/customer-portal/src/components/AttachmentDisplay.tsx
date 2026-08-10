import { findGifTile } from "@/mocks/gifLibrary";
import { formatDuration } from "@/lib/format";
import type { Attachment } from "@/types";

/** Renders a saved attachment for the recipient's reveal — real playback
 * when a blob URL is available, otherwise a static label for seed data. */
export function AttachmentDisplay({
  attachment,
  fromName,
}: {
  attachment: Attachment;
  fromName: string;
}) {
  if (attachment.kind === "image") {
    return attachment.url ? (
      <img
        src={attachment.url}
        alt={`A memory from ${fromName}`}
        loading="lazy"
        className="mt-6 h-[220px] w-full rounded-md object-cover"
      />
    ) : null;
  }

  if (attachment.kind === "gif") {
    const tile = findGifTile(attachment.url);
    return (
      <div
        className={`mt-6 flex h-[120px] items-center justify-center gap-2 rounded-md bg-gradient-to-br text-[13px] font-bold text-porcelain ${tile?.gradient ?? "from-mulberry to-plum"}`}
      >
        <span className="text-[26px]">{tile?.emoji ?? "✨"}</span>
        {tile?.label ?? "A little something extra"}
      </div>
    );
  }

  if (attachment.kind === "video") {
    return attachment.url ? (
      <video src={attachment.url} controls className="mt-6 h-[220px] w-full rounded-md object-cover" />
    ) : (
      <div className="mt-6 flex items-center justify-between rounded-md bg-plum px-4 py-4 text-[13px] text-[#F6F0E8]">
        <b className="text-champagne">▶ Play {fromName}'s video</b>
        <small>{formatDuration(attachment.durationSeconds ?? 28)}</small>
      </div>
    );
  }

  if (attachment.kind === "voice") {
    return attachment.url ? (
      <audio src={attachment.url} controls className="mt-6 w-full" />
    ) : (
      <div className="mt-6 flex items-center justify-between rounded-md bg-plum px-4 py-4 text-[13px] text-[#F6F0E8]">
        <b className="text-champagne">▶ Play {fromName}'s voice note</b>
        <small>{formatDuration(attachment.durationSeconds ?? 28)}</small>
      </div>
    );
  }

  return null;
}
