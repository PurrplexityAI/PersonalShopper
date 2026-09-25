import { repository } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const payload = await repository.exportData();
    setResponseHeader(event, 'Content-Type', 'application/json');
    setResponseHeader(
      event,
      'Content-Disposition',
      `attachment; filename=pantry-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    return payload;
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message });
  }
});
