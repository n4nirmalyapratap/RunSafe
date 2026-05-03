import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sopsTable = pgTable("sops", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  createdByClerkId: text("created_by_clerk_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const sopStepsTable = pgTable("sop_steps", {
  id: serial("id").primaryKey(),
  sopId: integer("sop_id").notNull(),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSopSchema = createInsertSchema(sopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSop = z.infer<typeof insertSopSchema>;
export type Sop = typeof sopsTable.$inferSelect;

export const insertSopStepSchema = createInsertSchema(sopStepsTable).omit({ id: true, createdAt: true });
export type InsertSopStep = z.infer<typeof insertSopStepSchema>;
export type SopStep = typeof sopStepsTable.$inferSelect;
