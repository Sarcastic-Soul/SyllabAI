import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk ID
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companions = pgTable("companions", {
  id: uuid("id").defaultRandom().primaryKey(),
  author: text("author").notNull(), // Clerk User ID
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  voice: text("voice").notNull(),
  style: text("style").notNull(),
  duration: integer("duration").notNull(),
  isBookmarked: boolean("isBookmarked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionHistory = pgTable("session_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  companionId: uuid("companion_id").references(() => companions.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companionsRelations = relations(companions, ({ many }) => ({
  sessions: many(sessionHistory),
}));

export const sessionHistoryRelations = relations(sessionHistory, ({ one }) => ({
  companion: one(companions, {
    fields: [sessionHistory.companionId],
    references: [companions.id],
  }),
}));
