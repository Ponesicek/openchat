import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const textModelsProviders = sqliteTable("textModelsProviders", {
  name: text().notNull().primaryKey(),
  apiKey: text(),
  apiUrl: text(),
  defaultModel: text(),
  fallbackModel: text(),
  additionalParams: text('', { mode: 'json' }),
  postProcess: integer().default(0),
});
