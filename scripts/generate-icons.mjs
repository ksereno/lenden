import sharp from "sharp";
import { readFileSync, copyFileSync } from "fs";

const SRC = "SVG Cats/Japanese Cat Maneki Neko.svg";
const BG = "#FFFFFF";

const targets = [
  { out: "app/apple-icon.png", size: 180 },
  { out: "public/icon-192.png", size: 192 },
  { out: "public/icon-512.png", size: 512 },
];

for (const { out, size } of targets) {
  await sharp(readFileSync(SRC))
    .resize(size, size, { fit: "contain", background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(out);
  console.log("wrote", out);
}

copyFileSync(SRC, "app/icon.svg");
console.log("wrote app/icon.svg");
