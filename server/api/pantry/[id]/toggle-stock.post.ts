import { repository } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID is required" });
    }
    const current = await repository.getById(id);
    if (!current) {
      throw createError({ statusCode: 404, statusMessage: "Item not found" });
    }
    const updated = await repository.update(id, { inStock: !current.inStock });
    return { success: true, data: updated };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
