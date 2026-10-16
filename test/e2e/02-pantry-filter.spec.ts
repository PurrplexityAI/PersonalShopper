import { describe, it } from "vitest";
import { expect } from "@playwright/test";
import { setup, createPage, url } from "@nuxt/test-utils/e2e";
import { devices } from "playwright-core";
import { runShowcaseFlow, sleep } from "./helpers/ui";

describe("Flow 2: Pantry Filter & Mobile Search Action", async () => {
  await setup({
    browser: true,
  });

  it("filters pantry for ketchup using the mobile search input and illuminated search button", async () => {
    const page = await createPage(url("/"), { ...devices["Pixel 7"] });
    const itemName = "Sauce, Ketchup";
    let createdItem = false;

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    try {
      // 1. Setup (Unrecorded): Verify "Sauce, Ketchup" exists or create it
      const pantryTab = page.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
      await pantryTab.click();
      await sleep(300);

      const searchInput = page.locator("input[placeholder*=\"Search pantry\"]");
      await searchInput.waitFor({ state: "visible" });
      await searchInput.fill(itemName);
      await sleep(300);

      const existingCard = page.locator("#pantry-items-start").locator(`text="${itemName}"`).first();
      const exists = await existingCard.isVisible();

      await searchInput.fill("");
      await sleep(200);

      if (!exists) {
        // Create it through UI
        const addPantryFab = page.locator("button[aria-label=\"Add Pantry Item\"]");
        await addPantryFab.click();

        const nameInput = page.locator("input[placeholder*=\"Greek Yogurt\"]");
        await nameInput.waitFor({ state: "visible" });
        await nameInput.fill(itemName);

        const submitBtn = page.locator("button:has-text(\"Add to Pantry\")");
        await submitBtn.click();
        await sleep(600);
        createdItem = true;
      }

      // 2. Showcase Flow (Recorded when SHOWCASE_RECORD=1)
      await runShowcaseFlow(page, "pantry-filter", async (recordPage) => {
        await recordPage.goto(url("/"));
        await recordPage.waitForLoadState("networkidle");

        const tab = recordPage.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
        await tab.click();
        await sleep(400);

        const search = recordPage.locator("input[placeholder*=\"Search pantry\"]");
        await expect(search).toBeVisible();

        // The mobile right arrow button is disabled/subtle before typing
        const arrowBtn = recordPage.locator("button[aria-label=\"Scroll to results\"]");
        await expect(arrowBtn).toBeDisabled();

        // Type "ketchup" smoothly
        await search.pressSequentially("ketchup", { delay: 75 });
        await sleep(300);

        // Mobile right-arrow button lights up (primary color / enabled)
        await expect(arrowBtn).toBeEnabled();
        await sleep(400);

        // Tap mobile right arrow button
        await arrowBtn.click();
        await sleep(500);

        // Verify "Sauce, Ketchup" is displayed in the filtered results
        const matchingCard = recordPage.locator("#pantry-items-start").locator(`text="${itemName}"`).first();
        await expect(matchingCard).toBeVisible();

        // Give viewer time to admire the filtered list in the GIF
        await sleep(900);
      });
    } finally {
      // 3. Teardown (Unrecorded): Clean up if created for test
      if (createdItem) {
        try {
          await page.goto(url("/"));
          await page.waitForLoadState("networkidle");

          const pantryTab = page.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
          await pantryTab.click();

          const searchInput = page.locator("input[placeholder*=\"Search pantry\"]");
          await searchInput.fill(itemName);
          await sleep(300);

          const cardContainer = page.locator("#pantry-items-start").locator("div.border").filter({ hasText: itemName }).first();
          const actionsBtn = cardContainer.locator("button[aria-label=\"Item actions\"]");
          if (await actionsBtn.isVisible()) {
            await actionsBtn.click();
            await sleep(200);
            const deleteBtn = page.locator("[role=\"menu\"] [role=\"menuitem\"]:has-text(\"Delete\"), button:has-text(\"Delete\")").first();
            if (await deleteBtn.isVisible()) {
              await deleteBtn.click();
              await sleep(400);
            }
          }
        } catch (err) {
          console.warn("Cleanup warning for Sauce, Ketchup:", err);
        }
      }
    }
  }, 60000);
});
