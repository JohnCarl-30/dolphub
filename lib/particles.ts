import type { ISourceOptions } from "@tsparticles/engine";

export const PARTICLE_BREAKPOINTS = [
  { maxWidth: 640, count: 30 },
  { maxWidth: 1024, count: 45 },
] as const;

export function particleCount(width: number): number {
  return PARTICLE_BREAKPOINTS.find((entry) => width < entry.maxWidth)?.count ?? 70;
}

export function particleOptions(ink: string): ISourceOptions {
  return {
    autoPlay: false,
    fullScreen: { enable: false },
    background: { opacity: 0 },
    fpsLimit: 60,
    detectRetina: true,
    // Visibility is managed alongside the user's pause state by the homepage.
    pauseOnBlur: false,
    pauseOnOutsideViewport: false,
    particles: {
      number: { value: particleCount(1024), density: { enable: false } },
      color: { value: ink },
      shape: { type: "circle" },
      opacity: { value: 0.35 },
      size: { value: { min: 1, max: 2 } },
      links: { enable: true, color: ink, distance: 150, opacity: 0.25, width: 1 },
      move: { enable: true, speed: 0.6, outModes: { default: "out" } },
    },
    responsive: PARTICLE_BREAKPOINTS.map(({ maxWidth, count }) => ({
      maxWidth,
      options: { particles: { number: { value: count } } },
    })),
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

export function shouldPlayParticles(
  environment: MotionEnvironment,
  paused: boolean,
  showcaseActive = false,
): boolean {
  return environment.ready && !environment.reducedMotion && !environment.hidden && !paused && !showcaseActive;
}
