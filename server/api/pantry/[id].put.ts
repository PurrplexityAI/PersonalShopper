import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }
  const body = await readBody(event);
  const updated = await withRepository(event, (repo) => repo.update(id, body));
  return { success: true, data: updated };
});
