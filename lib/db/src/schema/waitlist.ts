import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const waitlistTable = pgTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  building: text("building"),
  xHandle: text("x_handle"),
  linkedin: text("linkedin"),
  website: text("website"),
  projectUrl: text("project_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WaitlistSignupRow = typeof waitlistTable.$inferSelect;
