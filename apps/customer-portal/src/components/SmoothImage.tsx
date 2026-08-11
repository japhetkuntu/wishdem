import { useState } from "react";
import clsx from "clsx";

export interface SmoothImageProps {
  src: string;
  alt: string;
  /** Applied to the wrapper — this is what controls size/shape/position (aspect ratio,
   * rounded corners, absolute positioning, border). Reserves the image's footprint before
   * it loads, so nothing pops in or shifts layout around it. */
  className?: string;
  loading?: "lazy" | "eager";
  crossOrigin?: "anonymous" | "use-credentials";
  ariaHidden?: boolean;
}

/**
 * A plain &lt;img&gt; either shows nothing (transparent) or a half-loaded flash while the
 * network call finishes — this reserves the space with a soft pulse and fades the real
 * image in once it's actually ready, so the page never visibly "pops" as photos arrive.
 */
export function SmoothImage({
  src,
  alt,
  className,
  loading = "lazy",
  crossOrigin,
  ariaHidden,
}: SmoothImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx("relative overflow-hidden bg-porcelain/[0.06]", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-porcelain/[0.05]" />}
      <img
        src={src}
        alt={alt}
        aria-hidden={ariaHidden}
        loading={loading}
        crossOrigin={crossOrigin}
        onLoad={() => setLoaded(true)}
        className={clsx(
          "h-full w-full object-cover transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
