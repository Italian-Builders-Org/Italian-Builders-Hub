import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";

export const buildersTable = pgTable("builders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  highlight: text("highlight").notNull(),
  tags: text("tags").array().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type BuilderRow = typeof buildersTable.$inferSelect;
