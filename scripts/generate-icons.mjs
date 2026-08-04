import sharp from "sharp";
import { readFileSync, copyFileSync } from "fs";

const SRC = "SVG Cats/Japanese Cat Maneki Neko.svg";
const BG = "#262624";

const targets = [
  { out: "app/apple-icon.png", size: 180 },
  { out: "public/icon-192.png", size: 192 },
  { out: "public/icon-512.png", size: 512 },
];

for (const { out, size } of targets) {
  await sharp(readFileSync(SRC))
    .resize(Math.round(size * 0.86), Math.round(size * 0.86), { fit: "contain", background: BG })
    .extend({
      top: Math.round(size * 0.07),
      bottom: Math.round(size * 0.07),
      left: Math.round(size * 0.07),
      right: Math.round(size * 0.07),
      background: BG,
    })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log("wrote", out);
}

copyFileSync(SRC, "app/icon.svg");
console.log("wrote app/icon.svg");
