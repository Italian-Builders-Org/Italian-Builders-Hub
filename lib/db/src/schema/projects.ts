import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  builder: text("builder").notNull(),
  status: text("status").notNull(),
  statusColor: text("status_color").notNull(),
  imageUrl: text("image_url").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type ProjectRow = typeof projectsTable.$inferSelect;
