import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Run `node scripts/generate-icons.mjs` after editing the master vector.
const root = new URL("../", import.meta.url);
const master = await readFile(new URL("public/dolphub-logo.svg", root), "utf8");
const [x, y, width, height] = master.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
const side = Math.max(width, height) + 128;
const square = master.replace(
  /viewBox="[^"]+"/,
  `viewBox="${x + (width - side) / 2} ${y + (height - side) / 2} ${side} ${side}"`,
);
const favicon = square.replace(
  ">",
  ">\n  <style>@media (prefers-color-scheme: dark) { svg { fill: #fff; } }</style>",
);

await writeFile(new URL("app/icon.svg", root), favicon);
await sharp(Buffer.from(square))
  .resize(180, 180)
  .flatten({ background: "#fff" })
  .png()
  .toFile(new URL("app/apple-icon.png", root).pathname);
