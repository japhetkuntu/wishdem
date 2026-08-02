import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@wishdem/design-system";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { formatDuration } from "@/lib/format";
import { GIF_LIBRARY, findGifTile } from "@/mocks/gifLibrary";
import type { Attachment, AttachmentKind } from "@/types";

const TABS: { kind: AttachmentKind; label: string }[] = [
  { kind: "gif", label: "GIF" },
  { kind: "image", label: "Image" },
  { kind: "video", label: "Video" },
  { kind: "voice", label: "Voice note" },
];

export interface PanelProps {
  value: Attachment | null;
  onChange: (attachment: Attachment | null) => void;
}

export function AttachmentPicker({ value, onChange }: PanelProps) {
  const [activeKind, setActiveKind] = useState<AttachmentKind>(value?.kind ?? "gif");

  useEffect(() => {
    if (value) setActiveKind(value.kind);
  }, [value?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        {TABS.map((tab) => {
          const active = activeKind === tab.kind;
          const filled = value?.kind === tab.kind;
          return (
            <button
              key={tab.kind}
              type="button"
              onClick={() => setActiveKind(tab.kind)}
              className={clsx(
                "relative min-h-[52px] rounded-md border text-[13px] font-extrabold transition-colors",
                active
                  ? "border-champagne bg-mulberry"
                  : "border-porcelain/35 bg-transparent",
              )}
            >
              {tab.label}
              {filled && (
                <span className="absolute right-2 top-2 h-[6px] w-[6px] rounded-full bg-champagne" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.04] p-4">
        {activeKind === "gif" && <GifPanel value={value} onChange={onChange} />}
        {activeKind === "image" && <ImagePanel value={value} onChange={onChange} />}
        {activeKind === "video" && <VideoPanel value={value} onChange={onChange} />}
        {activeKind === "voice" && <VoicePanel value={value} onChange={onChange} />}
      </div>
    </div>
  );
}

function GifPanel({ value, onChange }: PanelProps) {
  const selected = value?.kind === "gif" ? findGifTile(value.url) : undefined;

  return (
    <div>
      <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-6">
        {GIF_LIBRARY.map((tile) => {
          const active = selected?.id === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() =>
                onChange(
                  active ? null : { kind: "gif", url: tile.id, label: tile.label },
                )
              }
              aria-pressed={active}
              className={clsx(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border bg-gradient-to-br text-[10px] font-bold leading-tight",
                tile.gradient,
                active ? "border-champagne" : "border-transparent",
              )}
            >
              <span className="text-[22px]">{tile.emoji}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] leading-[1.5] text-porcelain/65">
        {selected ? (
          <>
            <b className="font-extrabold text-champagne">{selected.label}</b> selected.{" "}
            <button type="button" onClick={() => onChange(null)} className="font-extrabold underline">
              Remove
            </button>
          </>
        ) : (
          "A small animated sticker to sit alongside your letter."
        )}
      </p>
    </div>
  );
}

export function ImagePanel({ value, onChange }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = value?.kind === "image" && value.url;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ kind: "image", url: URL.createObjectURL(file) });
  }

  if (hasImage) {
    return (
      <div className="relative overflow-hidden rounded-md">
        <img src={value!.url} alt="Attached memory" className="h-[180px] w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-plum/80 text-porcelain"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-porcelain/40 text-[13px] font-bold text-porcelain/75"
      >
        <span className="text-[22px]">🖼️</span>
        Choose a photo to keep with your letter
      </button>
    </div>
  );
}

export function VideoPanel({ value, onChange }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const recorder = useMediaRecorder({ video: true, maxSeconds: 30 });

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = recorder.stream;
  }, [recorder.stream]);

  useEffect(() => {
    if (recorder.status === "stopped" && recorder.blobUrl) {
      onChange({ kind: "video", url: recorder.blobUrl, durationSeconds: recorder.elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status, recorder.blobUrl]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = url;
    probe.onloadedmetadata = () => {
      if (probe.duration > 30) {
        setUploadError("Please choose a clip under 30 seconds.");
        URL.revokeObjectURL(url);
        return;
      }
      onChange({ kind: "video", url, durationSeconds: Math.round(probe.duration) });
    };
  }

  const hasVideo = value?.kind === "video" && value.url;

  if (recorder.status === "recording") {
    return (
      <div className="text-center">
        <video ref={videoRef} autoPlay muted playsInline className="mx-auto h-[180px] w-full rounded-md object-cover" />
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-bold text-rose">
          <span className="h-[8px] w-[8px] animate-pulse rounded-full bg-rose" />
          Recording · {formatDuration(recorder.elapsed)} / 0:30
        </div>
        <Button type="button" variant="outline" onClick={recorder.stop} className="mt-3">
          Stop recording
        </Button>
      </div>
    );
  }

  if (hasVideo) {
    return (
      <div>
        <video src={value!.url} controls className="h-[180px] w-full rounded-md object-cover" />
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="text-porcelain/65">
            {value!.durationSeconds ? `${formatDuration(value!.durationSeconds)} clip` : "Video attached"}
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={recorder.reset} className="font-extrabold text-champagne">
              Re-record
            </button>
            <button type="button" onClick={() => onChange(null)} className="font-extrabold underline">
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-[12px] text-porcelain/65">Up to 30 seconds — record now or upload a clip.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={recorder.start}>
          Record a video
        </Button>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Upload instead
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
      {(recorder.error || uploadError) && (
        <p className="text-[12px] text-rose">{recorder.error ?? uploadError}</p>
      )}
    </div>
  );
}

export function VoicePanel({ value, onChange }: PanelProps) {
  const recorder = useMediaRecorder({ video: false, maxSeconds: 30 });

  useEffect(() => {
    if (recorder.status === "stopped" && recorder.blobUrl) {
      onChange({ kind: "voice", url: recorder.blobUrl, durationSeconds: recorder.elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status, recorder.blobUrl]);

  const hasVoice = value?.kind === "voice" && value.url;

  if (recorder.status === "recording") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] animate-pulse rounded-full bg-champagne"
              style={{ height: `${12 + ((i * 7) % 24)}px`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[13px] font-bold text-rose">
          <span className="h-[8px] w-[8px] animate-pulse rounded-full bg-rose" />
          Recording · {formatDuration(recorder.elapsed)} / 0:30
        </div>
        <Button type="button" variant="outline" onClick={recorder.stop}>
          Stop recording
        </Button>
      </div>
    );
  }

  if (hasVoice) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <audio src={value!.url} controls className="w-full" />
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-porcelain/65">
            {value!.durationSeconds ? `${formatDuration(value!.durationSeconds)} note` : "Voice note attached"}
          </span>
          <button type="button" onClick={recorder.reset} className="font-extrabold text-champagne">
            Re-record
          </button>
          <button type="button" onClick={() => onChange(null)} className="font-extrabold underline">
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="text-[12px] text-porcelain/65">Up to 30 seconds — speak straight from the heart.</p>
      <Button type="button" onClick={recorder.start}>
        🎙️ Record voice note
      </Button>
      {recorder.error && <p className="text-[12px] text-rose">{recorder.error}</p>}
    </div>
  );
}
