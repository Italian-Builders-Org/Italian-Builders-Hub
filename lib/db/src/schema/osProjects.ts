import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";

export const osProjectsTable = pgTable("os_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type OsProjectRow = typeof osProjectsTable.$inferSelect;
