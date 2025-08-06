import { type Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ["openchat_*"],
} satisfies Config;
