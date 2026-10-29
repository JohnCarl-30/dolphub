"use client";

import { tsParticles, type Container, type CustomEventArgs } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useEffectEvent, useRef } from "react";
import { MAX_PARTICLES, particleOptions } from "@/lib/particles";
import { startParticleSession, syncParticlePlayback } from "@/lib/particle-session";

let engineInitialization: Promise<void> | undefined;

function initialize() {
  engineInitialization ??= loadSlim(tsParticles).catch((error: unknown) => {
    engineInitialization = undefined;
    throw error;
  });
  return engineInitialization;
}

export default function ParticleBackground({
  playing,
  driftAllowed,
  finePointer,
  onStatus,
}: {
  playing: boolean;
  driftAllowed: boolean;
  finePointer: boolean;
  onStatus: (status: "ready" | "failed") => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const container = useRef<Container | undefined>(undefined);
  const syncPlayback = useEffectEvent((instance: Container) => {
    syncParticlePlayback(instance, playing, finePointer, driftAllowed);
  });

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // A fresh host avoids sharing a late async load with a subsequent mount.
    const target = document.createElement("div");
    target.id = `dolphub-particles-${crypto.randomUUID()}`;
    target.className = "h-full w-full";
    target.dataset.particleHost = "true";
    element.append(target);
    const capParticles = () => {
      const instance = container.current;
      if (instance && instance.particles.count > MAX_PARTICLES) {
        instance.particles.removeQuantity(instance.particles.count - MAX_PARTICLES);
      }
    };
    let capTimer: number | undefined;
    const onResize = () => {
      if (capTimer !== undefined) window.clearTimeout(capTimer);
      capTimer = window.setTimeout(capParticles, 0);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    const onStarted = (args?: CustomEventArgs) => {
      const instance = args?.container;
      if (instance?.id.description === target.id) syncPlayback(instance);
    };
    tsParticles.addEventListener("containerStarted", onStarted);
    const dispose = startParticleSession({
      initialize,
      load: async () => {
        try {
          return await tsParticles.load({
            element: target,
            options: particleOptions(getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()),
          });
        } catch (error) {
          // The engine registers a container before async start completes.
          tsParticles.items.find((instance) => instance.id.description === target.id)?.destroy();
          throw error;
        }
      },
      onReady: (instance) => {
        container.current = instance;
        // Development/e2e-only diagnostic access; production hosts never expose the container.
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          (target as HTMLDivElement & { __dolphubParticleContainer?: Container }).__dolphubParticleContainer = instance;
        }
        capParticles();
        syncPlayback(instance);
        onStatus("ready");
      },
      onError: () => onStatus("failed"),
    });
    return () => {
      tsParticles.removeEventListener("containerStarted", onStarted);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (capTimer !== undefined) window.clearTimeout(capTimer);
      dispose();
      container.current = undefined;
      delete (target as HTMLDivElement & { __dolphubParticleContainer?: Container }).__dolphubParticleContainer;
      target.remove();
    };
  }, [onStatus]);

  useEffect(() => {
    if (container.current) syncPlayback(container.current);
  }, [playing, finePointer, driftAllowed]);

  return <div ref={host} className="h-full w-full" />;
}
