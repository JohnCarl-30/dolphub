import { describe, expect, it } from "vitest";
import { MAX_PARTICLES, particleCount, particleOptions, shouldMoveParticles, shouldPlayParticles } from "./particles";

describe("homepage particle configuration", () => {
  it.each([
    [412, 915, 45],
    [768, 800, 68],
    [1440, 700, 105],
  ])("uses one area density near the %i px checkpoint target", (width, height, expected) => {
    expect(Math.abs(particleCount(width, height) - expected)).toBeLessThanOrEqual(12);
    expect(particleCount(width, height)).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  it("scales continuously with area rather than defining responsive breakpoints", () => {
    expect(particleCount(800, 800)).toBeGreaterThan(particleCount(400, 800));
    expect(particleCount(800, 800)).toBeLessThan(particleCount(1200, 800));
  });

  it("uses the supplied design token and window interactions without click capture", () => {
    const options = particleOptions("#123456");
    expect(options.particles?.color).toEqual({ value: "#123456" });
    expect(options.particles?.links).toMatchObject({ color: "#123456", distance: 150, opacity: 0.25 });
    expect(options.particles?.number).toMatchObject({ density: { enable: true }, limit: { value: MAX_PARTICLES } });
    expect(options.interactivity).toMatchObject({
      detectsOn: "window",
      events: { onClick: { enable: false }, onHover: { enable: true, mode: [] } },
    });
    expect(options.autoPlay).toBe(false);
    expect(options.responsive).toBeUndefined();
    expect(options.pauseOnBlur).toBe(true);
  });
});

describe("particle playback", () => {
  const visible = { ready: true, reducedMotion: false, hidden: false };

  it("waits for browser preferences before starting", () => {
    expect(shouldPlayParticles({ ...visible, ready: false })).toBe(false);
  });

  it("runs whenever visible, while showcase traversal only disables autonomous movement", () => {
    expect(shouldPlayParticles(visible)).toBe(true);
    expect(shouldPlayParticles(visible)).toBe(true);
    expect(shouldMoveParticles(visible, true)).toBe(false);
    expect(shouldPlayParticles({ ...visible, hidden: true })).toBe(false);
    expect(shouldPlayParticles({ ...visible, reducedMotion: true })).toBe(false);
  });

  it("keeps visibility and reduced-motion rules during traversal", () => {
    for (const hidden of [false, true]) {
      for (const reducedMotion of [false, true]) {
        expect(shouldPlayParticles({ ...visible, hidden, reducedMotion })).toBe(!hidden && !reducedMotion);
        expect(shouldMoveParticles({ ...visible, hidden, reducedMotion }, true)).toBe(false);
      }
    }
  });

  it("resumes autonomous movement after leaving the showcase", () => {
    expect(shouldMoveParticles(visible, true)).toBe(false);
    expect(shouldMoveParticles(visible, false)).toBe(true);
    expect(shouldMoveParticles({ ...visible, hidden: true }, false)).toBe(false);
  });
});
