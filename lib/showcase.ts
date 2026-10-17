export function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Position-based easing: reversing or stopping never queues another animation. */
export function easeShowcase(value: number): number {
  const p = clampProgress(value);
  return p * p * (3 - 2 * p);
}

export function inverseShowcase(value: number): number {
  const target = clampProgress(value);
  if (target === 0 || target === 1) return target;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 32; i++) {
    const middle = (low + high) / 2;
    if (easeShowcase(middle) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function showcaseGeometry(trackWidth: number, frameWidth: number, frameHeight: number) {
  const travel = Math.max(0, trackWidth - frameWidth);
  return { travel, height: frameHeight + travel };
}

export function showcasePosition(scrollY: number, start: number, travel: number) {
  const progress = travel > 0 ? clampProgress((scrollY - start) / travel) : 0;
  const eased = easeShowcase(progress);
  return {
    progress,
    eased,
    x: -travel * eased,
    active: travel > 0 && scrollY >= start && scrollY < start + travel,
  };
}

export type ShowcaseLayout = "list" | "scroll" | "short" | "fits";

export function showcaseLayout({
  motionAllowed,
  listPreferred,
  requiredHeight,
  frameHeight,
  travel,
}: {
  motionAllowed: boolean;
  listPreferred: boolean;
  requiredHeight: number;
  frameHeight: number;
  travel: number;
}): ShowcaseLayout {
  if (!motionAllowed || listPreferred) return "list";
  if (requiredHeight > frameHeight) return "short";
  return travel > 1 ? "scroll" : "fits";
}

/** Reveal only as far as necessary, including the focus ring at either edge. */
export function cardScrollPosition({
  left,
  width,
  viewportWidth,
  currentOffset,
  travel,
  start,
}: {
  left: number;
  width: number;
  viewportWidth: number;
  currentOffset: number;
  travel: number;
  start: number;
}): number {
  if (travel <= 0) return start;
  let offset = currentOffset;
  if (left < offset + 4) offset = left - 4;
  else if (left + width > offset + viewportWidth - 4) offset = left + width - viewportWidth + 4;
  return start + inverseShowcase(offset / travel) * travel;
}

export function networkPosition(pageProgress: number, trackProgress: number, width: number, height: number) {
  return {
    x: -0.12 * width * easeShowcase(trackProgress),
    y: (0.08 - 0.16 * easeShowcase(pageProgress)) * height,
  };
}
