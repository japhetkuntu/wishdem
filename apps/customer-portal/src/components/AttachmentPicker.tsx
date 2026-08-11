import { useRef, useState } from "react";
import { uploadAttachment } from "@/lib/api";
import { SmoothImage } from "@/components/SmoothImage";
import type { Attachment } from "@/types";

export interface PickerProps {
  value: Attachment | null;
  onChange: (attachment: Attachment | null) => void;
  /** The wish this attachment belongs to — attachments upload to object storage
   * (DigitalOcean Spaces in production, MinIO locally) under this wish's folder.
   * Omitted by the unauthenticated group-wish guest contribution flow, which has
   * no wish/JWT to upload against yet and still uses local blob URLs only. */
  wishId?: string;
}

type PanelProps = PickerProps;

/** Photos only for now — voice/video recording may return later. */
export function AttachmentPicker({ value, onChange, wishId }: PickerProps) {
  return (
    <div className="rounded-lg border border-porcelain/[0.14] bg-porcelain/[0.04] p-4">
      <ImagePanel value={value} onChange={onChange} wishId={wishId} />
    </div>
  );
}

// The <input accept="image/*"> hint is a UI convenience only — a user can still pick
// "All Files" and choose anything, so we re-check type and cap size before upload.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function ImagePanel({ value, onChange, wishId }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const hasImage = value?.kind === "image" && value.url;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("That file isn't a photo. Please choose an image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("That photo is too large — please choose one under 10MB.");
      return;
    }

    if (!wishId) {
      onChange({ kind: "image", url: URL.createObjectURL(file) });
      return;
    }
    setUploading(true);
    try {
      const attachment = await uploadAttachment(wishId, file, file.name);
      onChange(attachment);
    } catch {
      setUploadError("We couldn't upload that photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (hasImage) {
    return (
      <div className="relative overflow-hidden rounded-md">
        <SmoothImage src={value!.url!} alt="Attached memory" loading="eager" className="h-[180px] w-full" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove photo"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-plum/80 text-[#F6F0E8] backdrop-blur-sm transition-colors hover:bg-plum"
        >
          <CloseIcon />
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
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group flex min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-porcelain/30 text-[13px] font-bold text-porcelain/75 transition-colors hover:border-champagne/50 hover:bg-porcelain/[0.03] disabled:cursor-not-allowed"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full border border-porcelain/20 bg-porcelain/[0.05] text-porcelain/65 transition-colors group-hover:border-champagne/40 group-hover:text-champagne">
          {uploading ? <SpinnerIcon /> : <PhotoUploadIcon />}
        </span>
        {uploading ? "Uploading…" : "Choose a photo to keep with your letter"}
      </button>
      {uploadError && <p className="mt-2 text-[12px] text-rose">{uploadError}</p>}
    </div>
  );
}

function PhotoUploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="M4 16.5 9 12l3.2 3.2L16 11l4 4.2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
