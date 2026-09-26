import { PrismaPantryRepository } from "./prismaRepository";
import type { PantryRepository } from "./repository";

// Export default repository for production / dev server
export const repository: PantryRepository = new PrismaPantryRepository();
