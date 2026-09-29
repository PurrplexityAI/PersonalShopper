import { withRepository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID is required" });
    }
    const updated = await withRepository(event, async (repo) => {
      const current = await repo.getById(id);
      if (!current) {
        throw createError({ statusCode: 404, statusMessage: "Item not found" });
      }
      return repo.update(id, { inStock: !current.inStock });
    });
    return { success: true, data: updated };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
