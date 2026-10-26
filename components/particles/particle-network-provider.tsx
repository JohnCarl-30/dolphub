"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type RefObject } from "react";
import { useMotionEnvironment } from "@/components/animations/use-motion-environment";
import { ParticleBoundary } from "@/components/particles/particle-boundary";
import { shouldMoveParticles, shouldPlayParticles, type MotionEnvironment } from "@/lib/particles";
import { clampProgress, particleDepth } from "@/lib/showcase";

const ParticleBackground = dynamic(() => import("@/components/particles/particle-background"), { ssr: false });

type ParticleNetworkValue = {
  network: RefObject<HTMLDivElement | null>;
  environment: MotionEnvironment & { finePointer: boolean };
  setShowcaseActive: (active: boolean) => void;
};

const ParticleNetworkContext = createContext<ParticleNetworkValue | null>(null);

function isDiscoveryPath(pathname: string): boolean {
  return ["/", "/home", "/what", "/about", "/vision", "/opportunities"].includes(pathname)
    || pathname.startsWith("/opportunities/")
    || pathname.startsWith("/u/");
}

export function ParticleNetworkProvider({ children }: PropsWithChildren) {
  const environment = useMotionEnvironment();
  const pathname = usePathname();
  const network = useRef<HTMLDivElement>(null);
  const [showcaseActive, setShowcaseActive] = useState(false);
  const [particleFailed, setParticleFailed] = useState(false);
  const onParticleStatus = useCallback((status: "ready" | "failed") => {
    if (status === "failed") setParticleFailed(true);
  }, []);
  const onParticleError = useCallback(() => setParticleFailed(true), []);
  const value = useMemo(() => ({ network, environment, setShowcaseActive }), [environment]);
  const showParticles = environment.ready && !environment.reducedMotion && !particleFailed;

  useEffect(() => {
    const layer = network.current;
    if (!layer) return;
    const reset = () => {
      layer.style.removeProperty("--particle-depth-y");
      layer.style.removeProperty("--particle-depth-scale");
    };
    reset();
    if (!environment.ready || environment.reducedMotion || environment.hidden || !isDiscoveryPath(pathname)) return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      const travel = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = particleDepth(clampProgress(window.scrollY / travel), window.innerHeight);
      layer.style.setProperty("--particle-depth-y", `${depth.y}px`);
      layer.style.setProperty("--particle-depth-scale", String(depth.scale));
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      reset();
    };
  }, [environment.hidden, environment.ready, environment.reducedMotion, pathname]);

  return (
    <ParticleNetworkContext.Provider value={value}>
      <div data-particle-layer className="particle-layer pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div ref={network} className="home-network">
          {showParticles ? (
            <ParticleBoundary onError={onParticleError}>
              <ParticleBackground
                playing={shouldPlayParticles(environment)}
                driftAllowed={shouldMoveParticles(environment, showcaseActive)}
                finePointer={environment.finePointer}
                onStatus={onParticleStatus}
              />
            </ParticleBoundary>
          ) : null}
        </div>
      </div>
      {children}
    </ParticleNetworkContext.Provider>
  );
}

export function useParticleNetwork() {
  const value = useContext(ParticleNetworkContext);
  if (!value) throw new Error("useParticleNetwork must be used inside SiteShell");
  return value;
}
