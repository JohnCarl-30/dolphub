"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMotionEnvironment } from "./animations/use-motion-environment";

/** The word "link", shown instead of said: real student links take turns inside the sentence. */
export function HandleSlot({ handles }: { handles: string[] }) {
  const { reducedMotion, hidden } = useMotionEnvironment();
  const [index, setIndex] = useState(0);
  const handle = handles[index % Math.max(1, handles.length)] ?? "you";

  useEffect(() => {
    if (reducedMotion || hidden || handles.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => value + 1), 2600);
    return () => window.clearInterval(timer);
  }, [reducedMotion, hidden, handles.length]);

  return (
    <span className="slot" data-ui>
      <Link key={handle} href={`/u/${handle}`} className="rise" aria-label={`Open the page for ${handle}`}>
        /u/{handle}
      </Link>
    </span>
  );
}
