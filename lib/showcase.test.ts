import { describe, expect, it } from "vitest";
import {
  cardScrollPosition,
  easeShowcase,
  inverseShowcase,
  networkPosition,
  showcaseGeometry,
  showcaseLayout,
  showcasePosition,
} from "./showcase";

describe("showcase scroll geometry", () => {
  it("allocates only horizontal overflow as additional vertical distance", () => {
    expect(showcaseGeometry(1800, 1100, 800)).toEqual({ travel: 700, height: 1500 });
    expect(showcaseGeometry(400, 1100, 800)).toEqual({ travel: 0, height: 800 });
  });

  it("clamps before/after the section and releases at the last card", () => {
    expect(showcasePosition(0, 500, 1000)).toMatchObject({ progress: 0, x: -0, active: false });
    expect(showcasePosition(500, 500, 1000)).toMatchObject({ progress: 0, active: true });
    expect(showcasePosition(1000, 500, 1000)).toMatchObject({ progress: 0.5, x: -500, active: true });
    expect(showcasePosition(1500, 500, 1000)).toMatchObject({ progress: 1, x: -1000, active: false });
    expect(showcasePosition(2000, 500, 1000).x).toBe(-1000);
    expect(showcasePosition(1000, 500, 0)).toMatchObject({ progress: 0, active: false });
  });
});

describe("position-based ease in and out", () => {
  it("slows the ends without overshooting, lag, or direction-dependent state", () => {
    expect(easeShowcase(-1)).toBe(0);
    expect(easeShowcase(2)).toBe(1);
    expect(easeShowcase(0.1)).toBeLessThan(0.1);
    expect(easeShowcase(0.9)).toBeGreaterThan(0.9);
    const positions = Array.from({ length: 101 }, (_, i) => easeShowcase(i / 100));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (let i = 0; i <= 100; i++) {
      expect(inverseShowcase(easeShowcase(i / 100))).toBeCloseTo(i / 100, 7);
    }
  });

  it("reveals keyboard targets using the inverse easing curve", () => {
    const input = { left: 720, width: 352, viewportWidth: 400, currentOffset: 0, travel: 1000, start: 500 };
    const scroll = cardScrollPosition(input);
    const offset = -showcasePosition(scroll, input.start, input.travel).x;
    expect(offset).toBeCloseTo(676, 5);
    expect(input.left + input.width - offset).toBeCloseTo(396, 5);
    const back = cardScrollPosition({ ...input, left: 0, currentOffset: offset });
    expect(back).toBe(500);
    expect(cardScrollPosition({ ...input, travel: 0 })).toBe(500);
  });

  it("keeps visible cards and the last card within travel bounds", () => {
    expect(cardScrollPosition({ left: 100, width: 200, viewportWidth: 400, currentOffset: 0, travel: 1000, start: 500 })).toBe(500);
    expect(cardScrollPosition({ left: 1100, width: 400, viewportWidth: 500, currentOffset: 0, travel: 1000, start: 500 })).toBe(1500);
  });
});

describe("showcase fallback policy", () => {
  const normal = { motionAllowed: true, listPreferred: false, requiredHeight: 620, frameHeight: 700, travel: 800 };
  it("supports phones without using pointer or width as a motion ban", () => {
    expect(showcaseLayout(normal)).toBe("scroll");
  });
  it("uses a list for preference, reduced motion, and insufficient height", () => {
    expect(showcaseLayout({ ...normal, listPreferred: true })).toBe("list");
    expect(showcaseLayout({ ...normal, motionAllowed: false })).toBe("list");
    expect(showcaseLayout({ ...normal, requiredHeight: 701 })).toBe("short");
    expect(showcaseLayout({ ...normal, requiredHeight: 700 })).toBe("scroll");
  });
  it("does not allocate a scroll journey when the cards already fit", () => {
    expect(showcaseLayout({ ...normal, travel: 0 })).toBe("fits");
    expect(showcaseLayout({ ...normal, travel: 1 })).toBe("fits");
  });
});

describe("coordinated background motion", () => {
  it("stays inside the 15% overscan on both axes", () => {
    for (const p of [-1, 0, 0.1, 0.5, 0.9, 1, 2]) {
      const { x, y } = networkPosition(p, p, 1000, 800);
      expect(x).toBeGreaterThanOrEqual(-120);
      expect(x).toBeLessThanOrEqual(0);
      expect(Math.abs(y)).toBeLessThanOrEqual(64);
    }
  });
  it("uses the same easing for the track and background", () => {
    const { x, y } = networkPosition(0.5, 0.25, 1000, 800);
    expect(y).toBe(0);
    expect(x / -120).toBe(showcasePosition(250, 0, 1000).eased);
  });
});
