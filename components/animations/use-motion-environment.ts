"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  reduced.addEventListener("change", onChange);
  fine.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    fine.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function snapshot() {
  return [
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    document.hidden,
  ].join(",");
}

const serverSnapshot = () => "pending";

export function useMotionEnvironment() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [reduced, fine, hidden] = value.split(",");
  return {
    ready: value !== "pending",
    reducedMotion: value === "pending" || reduced === "true",
    finePointer: fine === "true",
    hidden: value === "pending" || hidden === "true",
  };
}
