import { describe, it } from "vitest";
import { expect } from "@playwright/test";
import { setup, createPage, url } from "@nuxt/test-utils/e2e";
import { devices } from "playwright-core";
import { runShowcaseFlow, sleep } from "./helpers/ui";

describe("Flow 3: Shopping Checklist Toggle & Session History", async () => {
  await setup({
    browser: true,
  });

  it("checks off Sausage rolls triggering confetti and trip history, then unchecks back to active list", async () => {
    const page = await createPage(url("/"), { ...devices["Pixel 7"] });
    const itemName = "Sausage rolls";
    let createdItem = false;

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    try {
      // 1. Setup (Unrecorded): Ensure "Sausage rolls" is on active shopping list
      const shoppingTab = page.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Shopping\")");
      await shoppingTab.click();
      await sleep(300);

      const itemOnList = page.getByRole("button", { name: itemName, exact: true }).first();
      const isAlreadyOnList = await itemOnList.isVisible();

      if (!isAlreadyOnList) {
        // Add to shopping list via mobile quick-add
        const addShoppingFab = page.locator("button[aria-label=\"Add Shopping Item\"]");
        await addShoppingFab.click();

        const quickAddInput = page.getByPlaceholder("Add an item to the shopping list");
        await quickAddInput.waitFor({ state: "visible" });
        await quickAddInput.fill(itemName);

        const submitBtn = page.locator("button[aria-label=\"Add Item\"]");
        await submitBtn.click();
        await sleep(500);

        // If anomaly drawer popped up, accept it
        const anomalyDrawer = page.locator("text=\"Smart frequency tracking\"").first();
        if (await anomalyDrawer.isVisible()) {
          const opt = page.locator("button:has-text(\"Keep the usual frequency\"), button:has-text(\"Suggest this more often\")").first();
          await opt.click();
          await sleep(400);
        }

        createdItem = true;
      }

      // 2. Showcase Flow (Recorded when SHOWCASE_RECORD=1)
      await runShowcaseFlow(page, "shopping-toggle", async (recordPage) => {
        await recordPage.goto(url("/"));
        await recordPage.waitForLoadState("networkidle");

        const tab = recordPage.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Shopping\")");
        await tab.click();
        await sleep(400);

        // Find Sausage rolls card
        const sausageItemBtn = recordPage.getByRole("button", { name: itemName, exact: true }).first();
        await expect(sausageItemBtn).toBeVisible();

        const sausageCard = recordPage.locator("div[id^=\"shopping-item-\"]").filter({ has: sausageItemBtn }).first();

        // Checkbox button: aria-label="Tick off"
        const tickOffBtn = sausageCard.locator("button[aria-label=\"Tick off\"]");
        await expect(tickOffBtn).toBeVisible();
        await sleep(400);

        // Tap Tick off -> triggers confetti & moves to Purchased this trip
        await tickOffBtn.click();
        await sleep(700);

        // Purchased this trip button/badge should now be visible
        const purchasedSectionBtn = recordPage.locator("button:has-text(\"Purchased this trip\")");
        await expect(purchasedSectionBtn).toBeVisible();

        // Ensure section is expanded
        const uncheckBtn = recordPage.locator("button[aria-label=\"Mark unpurchased\"]").first();

        if (!(await uncheckBtn.isVisible())) {
          await purchasedSectionBtn.click();
          await sleep(400);
        }

        await expect(uncheckBtn).toBeVisible();
        // Pause longer after check so confetti and purchased session list are clearly observed
        await sleep(2200);

        // Tap uncheck button to restore item to active list
        await uncheckBtn.click();
        await sleep(600);

        // Verify Sausage rolls is back on active shopping list
        const restoredItemBtn = recordPage.getByRole("button", { name: itemName, exact: true }).first();
        await expect(restoredItemBtn).toBeVisible();

        // Pause to appreciate the restored state in the GIF
        await sleep(800);
      });
    } finally {
      // 3. Teardown (Unrecorded): If created purely for test, delete it via Pantry UI
      if (createdItem) {
        try {
          await page.goto(url("/"));
          await page.waitForLoadState("networkidle");

          const pantryTab = page.locator("nav[aria-label=\"Mobile Navigation\"] button:has-text(\"Pantry\")");
          await pantryTab.click();

          const searchInput = page.locator("input[placeholder*=\"Search pantry\"]");
          await searchInput.fill(itemName);
          await sleep(300);

          const matchingCard = page.locator("#pantry-items-start").getByRole("button", { name: itemName, exact: true }).first();
          if (await matchingCard.isVisible()) {
            const actionsBtn = page.locator("button[aria-label=\"Item actions\"]").first();
            if (await actionsBtn.isVisible()) {
              await actionsBtn.click();
              await sleep(200);
              const deleteBtn = page.locator("[role=\"menu\"] [role=\"menuitem\"]:has-text(\"Delete\"), button:has-text(\"Delete\")").first();
              if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await sleep(400);
              }
            }
          }
        } catch (err) {
          console.warn("Cleanup warning for Sausage rolls:", err);
        }
      }
    }
  }, 60000);
});
