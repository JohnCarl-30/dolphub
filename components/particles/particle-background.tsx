"use client";

import { initParticlesEngine } from "@tsparticles/react";
import { tsParticles, type Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useEffectEvent, useRef } from "react";
import { particleOptions } from "@/lib/particles";
import { startParticleSession, syncParticlePlayback } from "@/lib/particle-session";

let engineInitialization: Promise<void> | undefined;

function initialize() {
  engineInitialization ??= initParticlesEngine(loadSlim).catch((error: unknown) => {
    engineInitialization = undefined;
    throw error;
  });
  return engineInitialization;
}

export default function ParticleBackground({
  playing,
  finePointer,
  onStatus,
}: {
  playing: boolean;
  finePointer: boolean;
  onStatus: (status: "ready" | "failed") => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const container = useRef<Container | undefined>(undefined);
  const syncPlayback = useEffectEvent((instance: Container) => {
    syncParticlePlayback(instance, playing, finePointer);
  });

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // A fresh host avoids sharing a late async load with a subsequent mount.
    const target = document.createElement("div");
    target.id = `dolphub-particles-${crypto.randomUUID()}`;
    target.className = "h-full w-full";
    element.append(target);
    const onStarted = ({ container: instance }: { container?: Container }) => {
      if (instance?.canvas.element?.parentElement === target) syncPlayback(instance);
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
        syncPlayback(instance);
        onStatus("ready");
      },
      onError: () => onStatus("failed"),
    });
    return () => {
      tsParticles.removeEventListener("containerStarted", onStarted);
      dispose();
      container.current = undefined;
      target.remove();
    };
  }, [onStatus]);

  useEffect(() => {
    if (container.current) syncPlayback(container.current);
  }, [playing, finePointer]);

  return <div ref={host} className="h-full w-full" />;
}
