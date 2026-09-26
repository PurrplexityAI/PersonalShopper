import { repository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: "ID is required" });
    }
    const deleted = await repository.delete(id);
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: "Item not found" });
    }
    return { success: true, message: "Item deleted from pantry" };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});
