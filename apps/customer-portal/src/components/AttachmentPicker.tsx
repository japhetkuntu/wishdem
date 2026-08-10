import { useRef, useState } from "react";
import { uploadAttachment } from "@/lib/api";
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
        <img src={value!.url} alt="Attached memory" className="h-[180px] w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-plum/80 text-[#F6F0E8]"
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
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-porcelain/40 text-[13px] font-bold text-porcelain/75"
      >
        <span className="text-[22px]">{uploading ? "⏳" : "🖼️"}</span>
        {uploading ? "Uploading…" : "Choose a photo to keep with your letter"}
      </button>
      {uploadError && <p className="mt-2 text-[12px] text-rose">{uploadError}</p>}
    </div>
  );
}
