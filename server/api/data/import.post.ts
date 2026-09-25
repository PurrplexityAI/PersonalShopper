import { repository } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { items } = body;
    const result = await repository.importData(items);
    return { success: true, message: `Successfully imported ${result.count} pantry items.` };
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});
