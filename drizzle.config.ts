import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local first (developer overrides), then .env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://app:app@localhost:3306/challenges",
  },
});
