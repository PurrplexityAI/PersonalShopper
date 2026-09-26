import { repository } from "../../utils/db";

export default defineEventHandler(async () => {
  try {
    const resetItems = await repository.resetSampleData();
    return {
      success: true,
      data: resetItems,
      message: "Database reset to sample grocery items.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw createError({ statusCode: 500, statusMessage: message });
  }
});
