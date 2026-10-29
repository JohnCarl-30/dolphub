import { describe, expect, it } from "vitest";
import { boundedCrop, fitWithin, needsCompression, rotatedSize, SEND_AS_IS_BYTES } from "./photo-upload";

describe("photo upload preparation", () => {
  it("sends small JPEG, PNG and WebP files as they are", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(needsCompression({ type, size: 800_000 })).toBe(false);
    }
    expect(needsCompression({ type: "image/jpeg", size: SEND_AS_IS_BYTES })).toBe(false);
  });

  it("shrinks large files and converts other formats", () => {
    expect(needsCompression({ type: "image/jpeg", size: SEND_AS_IS_BYTES + 1 })).toBe(true);
    expect(needsCompression({ type: "image/heic", size: 900_000 })).toBe(true);
    expect(needsCompression({ type: "image/gif", size: 10_000 })).toBe(true);
  });

  it("fits the longer side within the limit without stretching small photos", () => {
    expect(fitWithin(4032, 3024, 2400)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600, 2400)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(10_000, 1, 100)).toEqual({ width: 100, height: 1 });
  });

  it("uses the correct bounding box for 90, 180 and 270 degree rotations", () => {
    expect(rotatedSize(400, 300, 90)).toEqual({ width: 300, height: 400 });
    expect(rotatedSize(400, 300, 180)).toEqual({ width: 400, height: 300 });
    expect(rotatedSize(400, 300, 270)).toEqual({ width: 300, height: 400 });
    expect(rotatedSize(400, 300, -90)).toEqual({ width: 300, height: 400 });
  });

  it("bounds square and 16:9 crops inside the rotated image", () => {
    expect(boundedCrop({ x: -10, y: 40, width: 200, height: 200 }, 300, 400))
      .toEqual({ x: 0, y: 40, width: 200, height: 200 });
    expect(boundedCrop({ x: 190, y: 80, width: 320, height: 180 }, 640, 360))
      .toEqual({ x: 190, y: 80, width: 320, height: 180 });
    expect(boundedCrop({ x: 500, y: 200, width: 320, height: 180 }, 640, 360))
      .toEqual({ x: 320, y: 180, width: 320, height: 180 });
    expect(fitWithin(3200, 1800, 2400)).toEqual({ width: 2400, height: 1350 });
  });
});
