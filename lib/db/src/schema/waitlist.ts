import { pgTable, text, serial, timestamp, uuid } from "drizzle-orm/pg-core";

export const waitlistTable = pgTable("waitlist_signups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  building: text("building"),
  telegramHandle: text("telegram_handle"),
  xHandle: text("x_handle"),
  linkedin: text("linkedin"),
  website: text("website"),
  projectUrl: text("project_url"),
  source: text("source").notNull().default("Website Waitlist"),
  status: text("status").notNull().default("pending"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  activatedBy: uuid("activated_by"),
  inviteId: uuid("invite_id"),
  inviteEmailSentAt: timestamp("invite_email_sent_at", { withTimezone: true }),
  inviteEmailError: text("invite_email_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WaitlistSignupRow = typeof waitlistTable.$inferSelect;
