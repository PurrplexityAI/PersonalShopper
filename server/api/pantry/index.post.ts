import { withRepository } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const newItem = await withRepository(event, (repo) => repo.create(body));
  setResponseStatus(event, 201);
  return { success: true, data: newItem };
});
