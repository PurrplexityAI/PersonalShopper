import "dotenv/config"; // Nuxt uses "c12" - so maybe we could use this rather than dotenv?
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  skills: {
    agents: ["agents"], //We only want the agent skills folder, not claude etc.
  },
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: {
      connection: process.env["NUXT_DIRECT_URL"],
    },
  }),
});
