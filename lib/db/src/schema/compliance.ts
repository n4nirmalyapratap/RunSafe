import { pgTable, text, serial, integer, timestamp, date, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const complianceItemsTable = pgTable("compliance_items", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  recurrence: text("recurrence").notNull().default("one_time"),
  dueDate: date("due_date"),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  lastReminderSentAt: timestamp("last_reminder_sent_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  // True for items auto-seeded from the regulatory catalog. The /compliance/sync
  // prune step only ever deletes rows where this is true — user-created or
  // user-edited items are never destroyed by a jurisdiction change.
  seededFromCatalog: boolean("seeded_from_catalog").notNull().default(false),
  reminder7SentForDueDate: date("reminder_7_sent_for_due_date"),
  reminder1SentForDueDate: date("reminder_1_sent_for_due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  workspaceTitleUq: uniqueIndex("compliance_items_workspace_title_uq").on(t.workspaceId, t.title),
  // Speeds up dashboard "next due" / overdue scans and the reminder cron,
  // which routinely filter compliance_items by workspace_id and dueDate.
  workspaceDueIdx: index("compliance_items_workspace_due_idx").on(t.workspaceId, t.dueDate),
}));

export const complianceCompletionsTable = pgTable("compliance_completions", {
  id: serial("id").primaryKey(),
  complianceItemId: integer("compliance_item_id")
    .notNull()
    .references(() => complianceItemsTable.id, { onDelete: "cascade" }),
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
