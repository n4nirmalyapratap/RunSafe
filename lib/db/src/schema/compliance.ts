import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complianceItemsTable = pgTable("compliance_items", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  recurrence: text("recurrence").notNull().default("one_time"),
  dueDate: date("due_date"),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  lastReminderSentAt: timestamp("last_reminder_sent_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  reminder7SentForDueDate: date("reminder_7_sent_for_due_date"),
  reminder1SentForDueDate: date("reminder_1_sent_for_due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const complianceCompletionsTable = pgTable("compliance_completions", {
  id: serial("id").primaryKey(),
  complianceItemId: integer("compliance_item_id").notNull(),
  completedByClerkId: text("completed_by_clerk_id").notNull(),
  completedByName: text("completed_by_name").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertComplianceItemSchema = createInsertSchema(complianceItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;
export type ComplianceItem = typeof complianceItemsTable.$inferSelect;

export const insertComplianceCompletionSchema = createInsertSchema(complianceCompletionsTable).omit({ id: true });
export type InsertComplianceCompletion = z.infer<typeof insertComplianceCompletionSchema>;
export type ComplianceCompletion = typeof complianceCompletionsTable.$inferSelect;
