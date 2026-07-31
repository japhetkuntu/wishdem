export function CountdownInline({ days }: { days: number }) {
  return (
    <span className="font-display text-[22px] text-champagne">
      {days} <span className="text-[11px] font-sans font-extrabold uppercase tracking-[0.1em] text-porcelain/70">days away</span>
    </span>
  );
}
