import { describe, expect, it } from "vitest";
import { particleCount, particleOptions, shouldPlayParticles } from "./particles";

describe("homepage particle configuration", () => {
  it.each([[375, 30], [639, 30], [640, 45], [768, 45], [1023, 45], [1024, 70], [1440, 70]])(
    "uses %i px to select %i particles",
    (width, expected) => expect(particleCount(width)).toBe(expected),
  );

  it("uses the supplied design token and window interactions without click capture", () => {
    const options = particleOptions("#123456");
    expect(options.particles?.color).toEqual({ value: "#123456" });
    expect(options.particles?.links).toMatchObject({ color: "#123456", distance: 150, opacity: 0.25 });
    expect(options.interactivity).toMatchObject({
      detectsOn: "window",
      events: { onClick: { enable: false }, onHover: { enable: true, mode: [] } },
    });
    expect(options.autoPlay).toBe(false);
    expect(options.responsive).toEqual([
      { maxWidth: 640, options: { particles: { number: { value: 30 } } } },
      { maxWidth: 1024, options: { particles: { number: { value: 45 } } } },
    ]);
  });
});

describe("particle playback", () => {
  const visible = { ready: true, reducedMotion: false, hidden: false };

  it("waits for browser preferences before starting", () => {
    expect(shouldPlayParticles({ ...visible, ready: false }, false)).toBe(false);
  });

  it("runs only when visible, allowed, and resumed", () => {
    expect(shouldPlayParticles(visible, false)).toBe(true);
    expect(shouldPlayParticles(visible, true)).toBe(false);
    expect(shouldPlayParticles({ ...visible, hidden: true }, false)).toBe(false);
    expect(shouldPlayParticles({ ...visible, reducedMotion: true }, false)).toBe(false);
  });

  it("retains manual pause across tab and reduced-motion changes", () => {
    for (const hidden of [false, true]) {
      for (const reducedMotion of [false, true]) {
        expect(shouldPlayParticles({ ...visible, hidden, reducedMotion }, true)).toBe(false);
      }
    }
  });

  it("pauses autonomous movement in the showcase without overriding manual pause", () => {
    expect(shouldPlayParticles(visible, false, true)).toBe(false);
    expect(shouldPlayParticles(visible, false, false)).toBe(true);
    expect(shouldPlayParticles(visible, true, false)).toBe(false);
    expect(shouldPlayParticles({ ...visible, hidden: true }, false, false)).toBe(false);
  });
});
