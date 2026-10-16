import path from "node:path";
import fs from "node:fs";
import { type Page, devices } from "playwright-core";
import { getBrowser } from "@nuxt/test-utils/e2e";

export const RECORDINGS_RAW_DIR = path.resolve("docs/assets/recordings/raw");

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a test action. If SHOWCASE_RECORD === "1", runs it in a dedicated
 * mobile context with video recording, visual touch ripple indicators,
 * and saves the resulting video to <flowName>.webm.
 * Otherwise, runs in the provided default page.
 */
export async function runShowcaseFlow(
  defaultPage: Page,
  flowName: string,
  fn: (page: Page) => Promise<void>
): Promise<void> {
  const isRecording = process.env.SHOWCASE_RECORD === "1";

  if (!isRecording) {
    await fn(defaultPage);
    return;
  }

  fs.mkdirSync(RECORDINGS_RAW_DIR, { recursive: true });

  const browser = await getBrowser();
  const context = await browser.newContext({
    ...devices["Pixel 7"],
    viewport: { width: 412, height: 840 },
    recordVideo: {
      dir: RECORDINGS_RAW_DIR,
      size: { width: 412, height: 840 },
    },
  });

  // Inject visual touch indicator during showcase recordings without modifying application code
  await context.addInitScript(() => {
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (!e) return;
        const dot = document.createElement("div");
        dot.style.position = "fixed";
        dot.style.left = `${e.clientX - 20}px`;
        dot.style.top = `${e.clientY - 20}px`;
        dot.style.width = "40px";
        dot.style.height = "40px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "rgba(13, 148, 136, 0.45)";
        dot.style.border = "2px solid rgba(255, 255, 255, 0.95)";
        dot.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.35)";
        dot.style.pointerEvents = "none";
        dot.style.zIndex = "2147483647";
        dot.style.transform = "scale(0.8)";
        dot.style.opacity = "1";
        dot.style.transition = "transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.4s ease-out";
        document.body.appendChild(dot);
        requestAnimationFrame(() => {
          dot.style.transform = "scale(1.5)";
          dot.style.opacity = "0";
        });
        setTimeout(() => {
          dot.remove();
        }, 450);
      },
      true
    );
  });

  const recordPage = await context.newPage();

  // Set up auto-accept for any unexpected confirm dialogs during recording
  recordPage.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  try {
    await fn(recordPage);
  } finally {
    const video = recordPage.video();
    await context.close();
    if (video) {
      const targetPath = path.join(RECORDINGS_RAW_DIR, `${flowName}.webm`);
      await video.saveAs(targetPath);
      // Clean up the original temporary file if saveAs created a copy
      try {
        await video.delete();
      } catch {
        // ignore if already deleted or moved
      }
    }
  }
}
