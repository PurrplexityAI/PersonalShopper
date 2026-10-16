import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ffmpegPath from "ffmpeg-static";

const RECORDINGS_DIR = path.resolve("docs/assets/recordings/raw");
const DEMO_DIR = path.resolve("docs/assets/demo");

console.log("\n==================================================");
console.log("   Generating Portfolio Showcase Recordings (E2E) ");
console.log("==================================================\n");

// Ensure target directories exist
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
fs.mkdirSync(DEMO_DIR, { recursive: true });

// Run the E2E showcase tests with recording enabled
const testResult = spawnSync("npx", ["vitest", "run", "--project", "e2e"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    SHOWCASE_RECORD: "1",
  },
});

if (testResult.status !== 0) {
  console.error("\n❌ Showcase test execution failed. See logs above.");
  process.exit(testResult.status ?? 1);
}

console.log("\n==================================================");
console.log("    Converting Videos to High-Quality GIFs        ");
console.log("==================================================\n");

if (!ffmpegPath) {
  console.error("❌ ffmpeg-static executable path not found.");
  process.exit(1);
}

const flows = [
  { name: "anomaly-prompt", label: "Smart Cadence Anomaly Modal" },
  { name: "pantry-filter", label: "Pantry Filter & Mobile Search" },
  { name: "shopping-toggle", label: "Shopping Checklist Toggle & Session History" },
];

for (const flow of flows) {
  const webmPath = path.join(RECORDINGS_DIR, `${flow.name}.webm`);
  const gifPath = path.join(DEMO_DIR, `${flow.name}.gif`);
  const pngPath = path.join(DEMO_DIR, `${flow.name}.png`);

  if (!fs.existsSync(webmPath)) {
    console.warn(`⚠️ Warning: Expected recording file not found: ${webmPath}`);
    continue;
  }

  console.log(`🎬 Processing ${flow.label}...`);

  // 1. Generate optimized GIF with 2-pass palette generation
  // fps=15, width=380, lanczos scaling, bayer dithering
  const gifArgs = [
    "-y",
    "-i",
    webmPath,
    "-vf",
    "fps=15,scale=380:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    "-loop",
    "0",
    gifPath,
  ];

  const gifRes = spawnSync(ffmpegPath, gifArgs, { stdio: "inherit" });
  if (gifRes.status !== 0) {
    console.error(`❌ Failed to convert ${flow.name}.webm to GIF`);
    continue;
  }

  // 2. Extract keyframe static PNG screenshot (near the climax/end of flow)
  const pngArgs = [
    "-y",
    "-sseof",
    "-1.5",
    "-i",
    webmPath,
    "-update",
    "1",
    "-q:v",
    "2",
    pngPath,
  ];

  spawnSync(ffmpegPath, pngArgs, { stdio: "ignore" });

  const gifStat = fs.statSync(gifPath);
  const sizeMb = (gifStat.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Generated ${path.basename(gifPath)} (${sizeMb} MB) and ${path.basename(pngPath)}`);
}

console.log("\n🎉 Showcase assets successfully generated in docs/assets/demo/\n");
process.exit(0);
