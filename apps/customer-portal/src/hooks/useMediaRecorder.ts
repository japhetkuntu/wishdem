import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "stopped" | "error";

/**
 * Thin wrapper over getUserMedia + MediaRecorder for capturing voice/video
 * attachments client-side, capped at `maxSeconds`. No server involved —
 * the resulting blob is exposed as an object URL for immediate playback,
 * matching the mock-data-layer pattern used elsewhere in the app.
 */
export function useMediaRecorder({
  video = false,
  maxSeconds = 30,
}: {
  video?: boolean;
  maxSeconds?: number;
}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { facingMode: "user" } : false,
      });
      streamRef.current = nextStream;
      setStream(nextStream);
      chunksRef.current = [];

      const recorder = new MediaRecorder(nextStream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: video ? "video/webm" : "audio/webm",
        });
        setBlobUrl(URL.createObjectURL(blob));
        setStatus("stopped");
        clearTimer();
        cleanupStream();
      };

      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= maxSeconds) stop();
          return next;
        });
      }, 1000);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? `${video ? "Camera" : "Microphone"} access was denied.`
          : "Recording isn't available on this device.",
      );
      cleanupStream();
    }
  }, [video, maxSeconds, stop, cleanupStream, clearTimer]);

  const reset = useCallback(() => {
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    clearTimer();
    cleanupStream();
    setStatus("idle");
    setElapsed(0);
    setError(null);
  }, [clearTimer, cleanupStream]);

  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, elapsed, blobUrl, error, stream, start, stop, reset };
}
