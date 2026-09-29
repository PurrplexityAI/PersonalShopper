import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const newItem = await withRepository(event, (repo) => repo.create(body));
    setResponseStatus(event, 201);
    return { success: true, data: newItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 400, statusMessage: message });
  }
});
