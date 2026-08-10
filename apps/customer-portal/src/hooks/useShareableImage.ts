import { useCallback, useRef, useState } from "react";

/**
 * Captures an off-DOM (or visually hidden) element as a PNG via html-to-image, then
 * either downloads it or hands it to the native share sheet as a file — the only way
 * to get an actual image attached into Instagram/WhatsApp/Messages share targets,
 * since none of those accept an image over a plain share-intent URL.
 */
export function useShareableImage(filename: string) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function capture(): Promise<Blob> {
    if (!elementRef.current) throw new Error("Nothing to capture yet.");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(elementRef.current, { pixelRatio: 2 });
    if (!blob) throw new Error("Couldn't render the image.");
    return blob;
  }

  const download = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const blob = await capture();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("We couldn't create that image. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [filename]);

  const share = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const blob = await capture();
      const file = new File([blob], `${filename}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "WishDem" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // AbortError just means the user closed the native share sheet — not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("We couldn't share that image. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [filename]);

  return { elementRef, busy, error, download, share };
}
