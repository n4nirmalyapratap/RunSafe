import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskAssignmentsTable = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  sopId: integer("sop_id").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  assigneeId: integer("assignee_id").notNull(),
  status: text("status").notNull().default("pending"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const taskStepCompletionsTable = pgTable("task_step_completions", {
  id: serial("id").primaryKey(),
  taskAssignmentId: integer("task_assignment_id").notNull(),
  sopStepId: integer("sop_step_id").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type TaskAssignment = typeof taskAssignmentsTable.$inferSelect;

export const insertTaskStepCompletionSchema = createInsertSchema(taskStepCompletionsTable).omit({ id: true });
export type InsertTaskStepCompletion = z.infer<typeof insertTaskStepCompletionSchema>;
export type TaskStepCompletion = typeof taskStepCompletionsTable.$inferSelect;
