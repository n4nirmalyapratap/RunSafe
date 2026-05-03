import { pgTable, text, serial, integer, timestamp, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";
import { sopsTable, sopStepsTable } from "./sops";
import { teamMembersTable } from "./teamMembers";

export const taskAssignmentsTable = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  sopId: integer("sop_id")
    .notNull()
    .references(() => sopsTable.id, { onDelete: "cascade" }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  assigneeId: integer("assignee_id")
    .notNull()
    .references(() => teamMembersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const taskStepCompletionsTable = pgTable("task_step_completions", {
  id: serial("id").primaryKey(),
  taskAssignmentId: integer("task_assignment_id")
    .notNull()
    .references(() => taskAssignmentsTable.id, { onDelete: "cascade" }),
  sopStepId: integer("sop_step_id")
    .notNull()
    .references(() => sopStepsTable.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  taskStepUq: uniqueIndex("task_step_completions_task_step_uq").on(t.taskAssignmentId, t.sopStepId),
}));

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type TaskAssignment = typeof taskAssignmentsTable.$inferSelect;

export const insertTaskStepCompletionSchema = createInsertSchema(taskStepCompletionsTable).omit({ id: true });
export type InsertTaskStepCompletion = z.infer<typeof insertTaskStepCompletionSchema>;
export type TaskStepCompletion = typeof taskStepCompletionsTable.$inferSelect;
