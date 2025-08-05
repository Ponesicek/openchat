import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

export type CreatorMetadata = {
  creatorName: string;
  characterVersion: string;
  creatorNotes: string;
  tags: string[];
}

export const tags = sqliteTable("tags", {
  id: integer().primaryKey(),
  name: text().notNull(),
});

export const images = sqliteTable("images", {
  id: integer().primaryKey(),
  name: text().notNull(),
  image: text().notNull(),
});

export const loreBooks = sqliteTable("loreBooks", {
  id: integer().primaryKey(),
  name: text().notNull(),
  type: text({enum: ["character", "normal"]}).default("normal"),
});

export const loreBookEntries = sqliteTable("loreBookEntries", {
  id: integer().primaryKey(), // Identifier
  loreBookId: integer().references(() => loreBooks.id),
  memo: text().notNull(), // Name, not shared with AI
  strategy: text({enum: ["constant", "normal", "RAG"]}).default("normal"), // Strategy to use for this entry
  position: text({enum: ["upChar", "downChar", "upEM", "downEM", "upAN", "downAN", "DS", "DU", "DA"]}).default("upChar"), // Where to put this entry in the prompt
  depth: integer(), // At what depth to insert (for DS, DU, DA)
  order: integer().default(100), // Order of the entry (if multiple entries are picked)
  trigger: integer().default(100), // Chance to trigger this entry
  keywords: text('', { mode: 'json' }), // Keywords to match
  logic: text({enum: ["AND ANY", "AND ALL", "NOT ALL", "NOT ANY"]}), // Logic to use for the keywords
  filters: text('', { mode: 'json' }), // Filters to apply to the keywords
  scanDepth: integer(), // How deep to scan for the entry
  caseSensitive: text({enum: ['true', 'false', "global"]}).default("global"), // Case sensitive
  wholeWord: text({enum: ['true', 'false', "global"]}).default("global"), // Whole word
  groupScoring: text({enum: ['true', 'false', "global"]}).default("global"), // Group scoring (if multiple entries are picked, use this to score them)
  automationId: text(), // Automation ID (if I decide to add scripting)
  nonRecursive: integer({mode: 'boolean'}), // Non recursive
  preventRecursion: integer({mode: 'boolean'}), // Prevent recursion
  delayUntilRecursion: integer({mode: 'boolean'}), // Delay until recursion

  // Inclusion Group Settings
  inclusionGroup: text(), // Group to include this entry in, only one entry with the same label will be activated
  prioritize: integer({mode: 'boolean'}).default(false), // Prioritize this entry
  groupWeight: integer().default(100), // Weight of the entry
  
  // Persistence Settings
  sticky: integer().default(0), // For how long to keep this entry in the prompt
  cooldown: integer().default(0), // For how long to wait before triggering this entry again
  delay: integer().default(0), // When in chat to allow this to trigger

  // Filtering Options
  filterToCharactersOrTags: text('', { mode: 'json' }), // Assign to a character or a tag
  exclude: integer({mode: 'boolean'}).default(false), // Exclude this entry from the prompt (Inverts the filterToCharactersOrTags)
  filterToGenerationTriggers: text('', { mode: 'json' }), // Filter to generation triggers (continue, impersonate, swipe, regenerate, quiet)

  // Additional Matching Sources
  matchCharacterDescription: integer({mode: 'boolean'}).default(false), // Match the character description
  matchCharacterPersonality: integer({mode: 'boolean'}).default(false), // Match the character personality
  matchScenario: integer({mode: 'boolean'}).default(false), // Match the scenario
  matchPersonaDescription: integer({mode: 'boolean'}).default(false), // Match the persona description
  matchCharactersNotes: integer({mode: 'boolean'}).default(false), // Match the characters notes
  matchCreatorsNotes: integer({mode: 'boolean'}).default(false), // Match the creators notes
  
  content: text(), // the actual content of the entry
  createdAt: integer().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer().notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const characters = sqliteTable("characters", {
  id: integer().primaryKey(),
  name: text().notNull(),
  description: text(),
  tags: text('', { mode: 'json' }),
  creatorNotes: text(),
  loreBooks: text('', { mode: 'json' }),
  image: text(),
  firstMessage: text(),
  createdAt: integer().notNull().default(sql`CURRENT_TIMESTAMP`),
  // Advanced settings
  mainPrompt: text(),
  postHistoryPrompt: text(),
  creatorMetadata: blob().$type<CreatorMetadata>(),
  personalitySummary: text(),
  scenario: text(),
  charactersOwnNotes: text(),
  talkativeness: integer().default(50),
  examples: text('', { mode: 'json' }),
});

export const textModelsProviders = sqliteTable("textModelsProviders", {
  name: text().notNull().primaryKey(),
  apiKey: text(),
  apiUrl: text(),
  defaultModel: text(),
  fallbackModel: text(),
  additionalParams: text('', { mode: 'json' }),
  postProcess: integer().default(0),
});

export const chats = sqliteTable("chats", {
  id: integer().primaryKey(),
  name: text().notNull(),
  createdAt: integer().notNull().default(sql`CURRENT_TIMESTAMP`),
  loreBooks: text('', { mode: 'json' }),
  additionalParams: text('', { mode: 'json' }),
});
