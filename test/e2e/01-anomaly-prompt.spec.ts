import { describe, it } from "vitest";
import { expect } from "@playwright/test";
import { setup, createPage, url } from "@nuxt/test-utils/e2e";
import { devices } from "playwright-core";
import { runShowcaseFlow, sleep } from "./helpers/ui";

describe("Flow 1: Smart Cadence Anomaly Modal", async () => {
  await setup({
    browser: true,
  });

  it("creates Greek Yogurt in pantry, triggers early anomaly prompt on shopping list, and cleans up", async () => {
    const page = await createPage(url("/"), { ...devices["Pixel 7"] });
    const itemName = "Greek Yogurt";

    // Setup dialog listener for confirm prompts
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    // Helper to delete an item via Pantry UI if present
    const deleteViaPantryUI = async (targetPage = page) => {
      await targetPage.goto(url("/"));
      await targetPage.waitForLoadState("networkidle");

      // Switch to Pantry tab
      const pantryTab = targetPage.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
      if (await pantryTab.isVisible()) {
        await pantryTab.click();
        await sleep(300);
      }

      const searchInput = targetPage.locator("input[placeholder*=\"Search pantry\"]");
      await searchInput.waitFor({ state: "visible" });
      await searchInput.fill(itemName);
      await sleep(400);

      const matchingItem = targetPage.locator("#pantry-items-start").getByRole("button", { name: itemName, exact: true });
      if (await matchingItem.isVisible()) {
        const actionsBtn = targetPage.locator("button[aria-label=\"Item actions\"]").first();
        if (await actionsBtn.isVisible()) {
          await actionsBtn.click();
          await sleep(250);
          const deleteBtn = targetPage.locator("[role=\"menu\"] [role=\"menuitem\"]:has-text(\"Delete\"), button:has-text(\"Delete\")").first();
          if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await sleep(500);
          }
        }
      }
      await searchInput.fill("");
    };

    try {
      // 1. Initial cleanup if "Greek Yogurt" was leftover from a previous aborted run
      await deleteViaPantryUI(page);

      // 2. Setup (Unrecorded): Create "Greek Yogurt" in Pantry (In Stock = true)
      await page.goto(url("/"));
      await page.waitForLoadState("networkidle");

      const pantryTab = page.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
      await pantryTab.click();
      await sleep(300);

      // Open Add Pantry Item FAB
      const addPantryFab = page.locator("button[aria-label=\"Add Pantry Item\"]");
      await addPantryFab.waitFor({ state: "visible" });
      await addPantryFab.click();

      // Fill in Name
      const nameInput = page.locator("input[placeholder*=\"Greek Yogurt\"]");
      await nameInput.waitFor({ state: "visible" });
      await nameInput.fill(itemName);

      // Set Cadence to Weekly (7d) if not already
      const weeklyBtn = page.locator("button:has-text(\"Weekly (7d)\")").first();
      if (await weeklyBtn.isVisible()) {
        await weeklyBtn.click();
      }

      // Submit Add to Pantry
      const submitBtn = page.locator("button:has-text(\"Add to Pantry\")");
      await submitBtn.click();
      await sleep(600);

      // 3. Showcase Flow (Recorded when SHOWCASE_RECORD=1)
      await runShowcaseFlow(page, "anomaly-prompt", async (recordPage) => {
        await recordPage.goto(url("/"));
        await recordPage.waitForLoadState("networkidle");

        // Ensure we are on Shopping list
        const shoppingTab = recordPage.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Shopping\")");
        if (await shoppingTab.isVisible()) {
          await shoppingTab.click();
          await sleep(400);
        }

        // Tap mobile Add Shopping Item FAB
        const addShoppingFab = recordPage.locator("button[aria-label=\"Add Shopping Item\"]");
        await expect(addShoppingFab).toBeVisible();
        await sleep(300);
        await addShoppingFab.click();

        // Focus & type Greek Yogurt in the mobile quick-add drawer
        const drawer = recordPage.locator("[role=\"dialog\"]").first();
        await expect(drawer).toBeVisible();

        const quickAddInput = drawer.getByPlaceholder("Add an item to the shopping list");
        await expect(quickAddInput).toBeVisible();
        await sleep(300);
        await quickAddInput.pressSequentially(itemName, { delay: 60 });
        await sleep(350);

        // Tap submit (solid up arrow button)
        const submitArrowBtn = drawer.locator("button[aria-label=\"Add Item\"]");
        await expect(submitArrowBtn).toBeEnabled();
        await submitArrowBtn.click();

        // Anomaly Modal / Drawer opens
        const anomalyTitle = recordPage.locator("text=\"Smart frequency tracking\"").first();
        await expect(anomalyTitle).toBeVisible({ timeout: 6000 });

        const anomalyMessage = recordPage.locator(`text='You need "${itemName}" sooner than expected.'`);
        await expect(anomalyMessage).toBeVisible();

        const suggestMoreOftenBtn = recordPage.locator("button:has-text(\"Suggest this more often\")");
        await expect(suggestMoreOftenBtn).toBeVisible();

        // Pause to let viewer read the modal in the GIF
        await sleep(2200);

        // Select "Suggest this more often"
        await suggestMoreOftenBtn.click();

        // Verify drawer closes and item appears on the active shopping list
        await expect(anomalyTitle).not.toBeVisible();
        const shoppingItem = recordPage.getByRole("button", { name: itemName, exact: true });
        await expect(shoppingItem).toBeVisible();

        // Brief settling pause after smooth scroll highlight
        await sleep(800);
      });
    } finally {
      // 4. Teardown (Unrecorded): Clean up Greek Yogurt via Pantry UI
      try {
        await deleteViaPantryUI(page);
      } catch (err) {
        console.warn("Cleanup warning for Greek Yogurt:", err);
      }
    }
  }, 60000);
});
