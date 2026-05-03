import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";
import { teamMembersTable } from "./teamMembers";

// ─── BREACH MONITORING ──────────────────────────────────────────
// One row per (workspace, member) holding the most recent breach scan
// result. Re-checks update the same row in place.
export const securityBreachChecksTable = pgTable(
  "security_breach_checks",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => teamMembersTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    breachCount: integer("breach_count").notNull().default(0),
    // [{ name: string, date: string, dataClasses: string[] }]
    breaches: jsonb("breaches").$type<
      Array<{ name: string; date?: string; dataClasses: string[] }>
    >().notNull().default([]),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memberUq: uniqueIndex("security_breach_checks_member_uq").on(t.memberId),
  }),
);

// ─── PHISHING SIMULATION ────────────────────────────────────────
export const securityPhishingCampaignsTable = pgTable(
  "security_phishing_campaigns",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // References a built-in template key from the seeded catalog
    // (e.g. "fake-invoice", "ceo-gift-card").
    templateKey: text("template_key").notNull(),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index("security_phishing_campaigns_ws_idx").on(t.workspaceId),
  }),
);

export const securityPhishingResultsTable = pgTable(
  "security_phishing_results",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id")
      .notNull()
      .references(() => securityPhishingCampaignsTable.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => teamMembersTable.id, { onDelete: "cascade" }),
    // Unique opaque token used in the per-recipient bait URL. Must be
    // hard to guess and globally unique so /phish/:token resolves
    // unambiguously.
    token: text("token").notNull(),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    reportedAt: timestamp("reported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUq: uniqueIndex("security_phishing_results_token_uq").on(t.token),
    campaignMemberUq: uniqueIndex("security_phishing_results_campaign_member_uq").on(
      t.campaignId,
      t.memberId,
    ),
  }),
);

// ─── SECURITY AWARENESS TRAINING ────────────────────────────────
// Lessons are seeded per workspace from a built-in catalog. Owners can
// also create custom lessons (catalogKey will be null in that case).
export const securityTrainingLessonsTable = pgTable(
  "security_training_lessons",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    catalogKey: text("catalog_key"), // null for custom, set for seeded
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("awareness"),
    durationMinutes: integer("duration_minutes").notNull().default(5),
    // { steps: [{title, body}], quiz: [{q, choices, answerIdx}] }
    content: jsonb("content").$type<{
      steps: Array<{ title: string; body: string }>;
      quiz: Array<{ q: string; choices: string[]; answerIdx: number }>;
    }>().notNull(),
    seededFromCatalog: boolean("seeded_from_catalog").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceCatalogUq: uniqueIndex("security_training_lessons_ws_catalog_uq").on(
      t.workspaceId,
      t.catalogKey,
    ),
  }),
);

export const securityTrainingCompletionsTable = pgTable(
  "security_training_completions",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => securityTrainingLessonsTable.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => teamMembersTable.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 0-100
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    lessonMemberUq: uniqueIndex("security_training_completions_lesson_member_uq").on(
      t.lessonId,
      t.memberId,
    ),
  }),
);

// ─── PASSWORD HYGIENE ───────────────────────────────────────────
// Self-attestation — staff confirm they follow good password practices.
// Score is 0-100 derived from the four flags.
export const securityPasswordAttestationsTable = pgTable(
  "security_password_attestations",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => teamMembersTable.id, { onDelete: "cascade" }),
    usesManager: boolean("uses_manager").notNull().default(false),
    length12Plus: boolean("length_12_plus").notNull().default(false),
    uniquePerSite: boolean("unique_per_site").notNull().default(false),
    mfaEverywhere: boolean("mfa_everywhere").notNull().default(false),
    score: integer("score").notNull().default(0),
    attestedAt: timestamp("attested_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memberUq: uniqueIndex("security_password_attestations_member_uq").on(t.memberId),
  }),
);

// ─── INCIDENT RESPONSE PLAYBOOKS ────────────────────────────────
export const securityPlaybooksTable = pgTable(
  "security_playbooks",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    catalogKey: text("catalog_key"),
    title: text("title").notNull(),
    category: text("category").notNull(), // ransomware, lost-device, etc.
    severity: text("severity").notNull().default("medium"), // low|medium|high|critical
    description: text("description"),
    // [{title, detail, action?}]
    steps: jsonb("steps").$type<
      Array<{ title: string; detail: string }>
    >().notNull(),
    seededFromCatalog: boolean("seeded_from_catalog").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceCatalogUq: uniqueIndex("security_playbooks_ws_catalog_uq").on(
      t.workspaceId,
      t.catalogKey,
    ),
  }),
);

export const securityIncidentsTable = pgTable("security_incidents", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  playbookId: integer("playbook_id")
    .notNull()
    .references(() => securityPlaybooksTable.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"), // open|resolved
  openedByClerkId: text("opened_by_clerk_id").notNull(),
  openedByName: text("opened_by_name").notNull(),
  notes: text("notes"),
  // step indices that have been ticked off
  completedStepIndices: jsonb("completed_step_indices").$type<number[]>().notNull().default([]),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// ─── VENDOR / SAAS RISK REGISTER ────────────────────────────────
export const securityVendorsTable = pgTable("security_vendors", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspacesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("saas"),
  dataAccess: text("data_access").notNull().default("medium"), // low|medium|high|critical
  hasMfa: boolean("has_mfa").notNull().default(false),
  hasSso: boolean("has_sso").notNull().default(false),
  notes: text("notes"),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── DEVICE & MFA INVENTORY ─────────────────────────────────────
export const securityDevicesTable = pgTable("security_devices", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => teamMembersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Sarah's Macbook Pro"
  type: text("type").notNull().default("laptop"), // laptop|phone|tablet|desktop
  os: text("os"), // "macOS 14", "Windows 11", "iOS 17"
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  diskEncrypted: boolean("disk_encrypted").notNull().default(false),
  autoUpdates: boolean("auto_updates").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SecurityBreachCheck = typeof securityBreachChecksTable.$inferSelect;
export type SecurityPhishingCampaign = typeof securityPhishingCampaignsTable.$inferSelect;
export type SecurityPhishingResult = typeof securityPhishingResultsTable.$inferSelect;
export type SecurityTrainingLesson = typeof securityTrainingLessonsTable.$inferSelect;
export type SecurityTrainingCompletion = typeof securityTrainingCompletionsTable.$inferSelect;
export type SecurityPasswordAttestation = typeof securityPasswordAttestationsTable.$inferSelect;
export type SecurityPlaybook = typeof securityPlaybooksTable.$inferSelect;
export type SecurityIncident = typeof securityIncidentsTable.$inferSelect;
export type SecurityVendor = typeof securityVendorsTable.$inferSelect;
export type SecurityDevice = typeof securityDevicesTable.$inferSelect;
