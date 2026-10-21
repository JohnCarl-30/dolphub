import type { ISourceOptions } from "@tsparticles/engine";

/** One area value drives density at every viewport size; it is not a breakpoint table. */
export const PARTICLE_DENSITY_AREA = 900_000;
export const MAX_PARTICLES = 110;

/** Estimate the calibrated density at a viewport checkpoint for tests and diagnostics. */
export function particleCount(width: number, height: number, pixelRatio = 1): number {
  const area = Math.max(1, width) * Math.max(1, height) / Math.max(1, pixelRatio ** 2);
  return Math.min(MAX_PARTICLES, Math.round((MAX_PARTICLES * area) / PARTICLE_DENSITY_AREA));
}

export function particleOptions(ink: string): ISourceOptions {
  return {
    autoPlay: false,
    fullScreen: { enable: false },
    background: { opacity: 0 },
    fpsLimit: 60,
    detectRetina: true,
    // The persistent provider owns visibility/showcase playback; tsParticles also pauses on blur.
    pauseOnBlur: true,
    pauseOnOutsideViewport: false,
    particles: {
      // Density is calculated from one area value. MAX_PARTICLES is a hard safety cap.
      number: {
        value: MAX_PARTICLES,
        limit: { mode: "delete", value: MAX_PARTICLES },
        density: { enable: true, width: Math.sqrt(PARTICLE_DENSITY_AREA), height: Math.sqrt(PARTICLE_DENSITY_AREA) },
      },
      color: { value: ink },
      shape: { type: "circle" },
      opacity: { value: 0.35 },
      size: { value: { min: 1, max: 2 } },
      links: { enable: true, color: ink, distance: 150, opacity: 0.25, width: 1 },
      move: { enable: true, speed: 0.6, outModes: { default: "out" } },
    },
    interactivity: {
      detectsOn: "window",
      events: {
        onClick: { enable: false },
        // Keep listeners registered; activate repulsion only for a fine pointer.
        onHover: { enable: true, mode: [] },
      },
      modes: { repulse: { distance: 120, duration: 0.4 } },
    },
  };
}

export interface MotionEnvironment {
  ready: boolean;
  reducedMotion: boolean;
  hidden: boolean;
}

export function shouldPlayParticles(environment: MotionEnvironment): boolean {
  return environment.ready && !environment.reducedMotion && !environment.hidden;
}

export function shouldMoveParticles(environment: MotionEnvironment, showcaseActive: boolean): boolean {
  return shouldPlayParticles(environment) && !showcaseActive;
}
