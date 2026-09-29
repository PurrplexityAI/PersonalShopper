import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { nameOrId, quantity, category, frequencyDays, unit } = body;
    if (!nameOrId || typeof nameOrId !== "string") {
      throw createError({ statusCode: 400, statusMessage: "nameOrId is required" });
    }

    const result = await withRepository(event, (repo) =>
      repo.addToShoppingList(nameOrId, {
        quantity: Number(quantity) || 1,
        category,
        frequencyDays: Number(frequencyDays) || 7,
        unit,
      })
    );

    return {
      success: true,
      data: result.item,
      createdInPantry: result.createdInPantry,
      message: result.createdInPantry
        ? `Added "${result.item.name}" to shopping list and created it in pantry!`
        : `Added "${result.item.name}" to shopping list.`,
    };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
