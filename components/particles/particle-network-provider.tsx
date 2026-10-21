"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren, type RefObject } from "react";
import { useMotionEnvironment } from "@/components/animations/use-motion-environment";
import { ParticleBoundary } from "@/components/particles/particle-boundary";
import { shouldMoveParticles, shouldPlayParticles, type MotionEnvironment } from "@/lib/particles";

const ParticleBackground = dynamic(() => import("@/components/particles/particle-background"), { ssr: false });

type ParticleNetworkValue = {
  network: RefObject<HTMLDivElement | null>;
  environment: MotionEnvironment & { finePointer: boolean };
  setShowcaseActive: (active: boolean) => void;
};

const ParticleNetworkContext = createContext<ParticleNetworkValue | null>(null);

export function ParticleNetworkProvider({ children }: PropsWithChildren) {
  const environment = useMotionEnvironment();
  const network = useRef<HTMLDivElement>(null);
  const [showcaseActive, setShowcaseActive] = useState(false);
  const [particleFailed, setParticleFailed] = useState(false);
  const onParticleStatus = useCallback((status: "ready" | "failed") => {
    if (status === "failed") setParticleFailed(true);
  }, []);
  const onParticleError = useCallback(() => setParticleFailed(true), []);
  const value = useMemo(() => ({ network, environment, setShowcaseActive }), [environment]);
  const showParticles = environment.ready && !environment.reducedMotion && !particleFailed;

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
