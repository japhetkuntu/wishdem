import { useLayoutEffect, useRef, useState } from "react";
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // On refresh/revisit the browser often already has this image cached — if so,
  // `img.complete` is already true the instant this mounts. Checking that in a layout
  // effect (which runs before the browser paints) lets us skip straight to the loaded
  // state so there's no pulse-then-fade flash for an image the user already has; a
  // genuinely uncached image still falls through to the normal onLoad + fade below.
  useLayoutEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div className={clsx("relative overflow-hidden bg-porcelain/[0.06]", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-porcelain/[0.05]" />}
      <img
        ref={imgRef}
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
