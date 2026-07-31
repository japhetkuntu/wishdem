import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import clsx from "clsx";

/**
 * Six-digit code entry — auto-advances on input, supports backspace-to-
 * previous, and accepts a full pasted code in one go.
 */
export function OtpInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1) ?? "";
    const next = [...values];
    next[index] = digit;
    onChange(next);
    if (digit && index < values.length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = values.map((_, i) => text[i] ?? "");
    onChange(next);
    const lastIndex = Math.min(text.length, values.length) - 1;
    refs.current[Math.max(lastIndex, 0)]?.focus();
  }

  return (
    <div className="grid grid-cols-6 gap-2" aria-label="Six digit verification code">
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          maxLength={1}
          autoFocus={i === 0}
          value={digit}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
          className={clsx(
            "aspect-square w-full rounded-[10px] border bg-white text-center font-semibold text-[20px] text-plum outline-none",
            focusedIndex === i
              ? "border-2 border-champagne shadow-[0_0_0_3px_rgba(230,200,122,.25)]"
              : "border-plum/20",
          )}
        />
      ))}
    </div>
  );
}
