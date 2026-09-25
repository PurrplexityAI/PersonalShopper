import { JsonFilePantryRepository } from './jsonRepository';
import type { PantryRepository } from './repository';

// Export default repository for production / dev server
export const repository: PantryRepository = new JsonFilePantryRepository();
