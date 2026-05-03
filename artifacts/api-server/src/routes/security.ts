import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  db,
  teamMembersTable,
  securityBreachChecksTable,
  securityPhishingCampaignsTable,
  securityPhishingResultsTable,
  securityTrainingLessonsTable,
  securityTrainingCompletionsTable,
  securityPasswordAttestationsTable,
  securityPlaybooksTable,
  securityIncidentsTable,
  securityVendorsTable,
  securityDevicesTable,
} from "@workspace/db";
import {
  GetSecurityBreachChecksResponse,
  RefreshSecurityBreachCheckParams,
  RefreshSecurityBreachCheckResponse,
  GetSecuritySummaryResponse,
  GetPhishingTemplatesResponse,
  GetPhishingCampaignsResponse,
  CreatePhishingCampaignBody,
  GetPhishingCampaignParams,
  GetPhishingCampaignResponse,
  DeletePhishingCampaignParams,
  GetTrainingLessonsResponse,
  GetTrainingLessonParams,
  GetTrainingLessonResponse,
  CompleteTrainingLessonParams,
  CompleteTrainingLessonBody,
  CompleteTrainingLessonResponse,
  GetPasswordAttestationsResponse,
  GetMyPasswordAttestationResponse,
  UpsertMyPasswordAttestationBody,
  UpsertMyPasswordAttestationResponse,
  GetPlaybooksResponse,
  GetPlaybookParams,
  GetPlaybookResponse,
  GetIncidentsResponse,
  CreateIncidentBody,
  UpdateIncidentParams,
  UpdateIncidentBody,
  UpdateIncidentResponse,
  GetVendorsResponse,
  CreateVendorBody,
  UpdateVendorParams,
  UpdateVendorBody,
  UpdateVendorResponse,
  DeleteVendorParams,
  GetDevicesResponse,
  CreateDeviceBody,
  UpdateDeviceParams,
  UpdateDeviceBody,
  UpdateDeviceResponse,
  DeleteDeviceParams,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";
import { logger } from "../lib/logger";
import {
  SEED_LESSONS,
  SEED_PLAYBOOKS,
  PHISHING_TEMPLATES,
} from "../lib/securitySeed";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────

async function ensureLessonsSeeded(workspaceId: number) {
  const existing = await db
    .select({ catalogKey: securityTrainingLessonsTable.catalogKey })
    .from(securityTrainingLessonsTable)
    .where(
      and(
        eq(securityTrainingLessonsTable.workspaceId, workspaceId),
        eq(securityTrainingLessonsTable.seededFromCatalog, true),
      ),
    );
  const have = new Set(existing.map((r) => r.catalogKey));
  const missing = SEED_LESSONS.filter((s) => !have.has(s.catalogKey));
  if (missing.length === 0) return;
  await db.insert(securityTrainingLessonsTable).values(
    missing.map((s) => ({
      workspaceId,
      catalogKey: s.catalogKey,
      title: s.title,
      description: s.description,
      category: s.category,
      durationMinutes: s.durationMinutes,
      content: s.content,
      seededFromCatalog: true,
    })),
  );
}

async function ensurePlaybooksSeeded(workspaceId: number) {
  const existing = await db
    .select({ catalogKey: securityPlaybooksTable.catalogKey })
    .from(securityPlaybooksTable)
    .where(
      and(
        eq(securityPlaybooksTable.workspaceId, workspaceId),
        eq(securityPlaybooksTable.seededFromCatalog, true),
      ),
    );
  const have = new Set(existing.map((r) => r.catalogKey));
  const missing = SEED_PLAYBOOKS.filter((p) => !have.has(p.catalogKey));
  if (missing.length === 0) return;
  await db.insert(securityPlaybooksTable).values(
    missing.map((p) => ({
      workspaceId,
      catalogKey: p.catalogKey,
      title: p.title,
      category: p.category,
      severity: p.severity,
      description: p.description,
      steps: p.steps,
      seededFromCatalog: true,
    })),
  );
}

function passwordScore(a: {
  usesManager: boolean;
  length12Plus: boolean;
  uniquePerSite: boolean;
  mfaEverywhere: boolean;
}): number {
  const flags = [a.usesManager, a.length12Plus, a.uniquePerSite, a.mfaEverywhere];
  const yes = flags.filter(Boolean).length;
  return Math.round((yes / flags.length) * 100);
}

function getAppOrigin(): string {
  return (
    (process.env.RUNSAFE_APP_ORIGIN ?? "").split(",")[0]?.trim() ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "")
  );
}

/** Public tracking URL embedded in phishing emails. Hits the API, records
 * the click, then 302s to the teaching landing page. */
function buildPhishLink(token: string): string {
  return `${getAppOrigin()}/api/phish/${token}`;
}

/** Frontend teaching landing page URL (the redirect target). Honors
 * RUNSAFE_BASE_PATH override; defaults to the artifact's registered path. */
function buildLandingUrl(token: string): string {
  const basePath =
    (process.env.RUNSAFE_BASE_PATH ?? "").trim().replace(/\/$/, "") || "/runsafe";
  return `${getAppOrigin()}${basePath}/phishing-caught/${token}`;
}

// ─── SUMMARY (posture score) ─────────────────────────────────────
router.get("/security/summary", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can view security summary" });
    return;
  }

  await Promise.all([
    ensureLessonsSeeded(ctx.workspaceId),
    ensurePlaybooksSeeded(ctx.workspaceId),
  ]);

  const [
    members,
    breachChecks,
    lessons,
    completions,
    attestations,
    vendors,
    devices,
    openIncidentsRows,
    latestCampaign,
  ] = await Promise.all([
    db.select({ id: teamMembersTable.id })
      .from(teamMembersTable)
      .where(and(
        eq(teamMembersTable.workspaceId, ctx.workspaceId),
        eq(teamMembersTable.status, "active"),
      )),
    db.select().from(securityBreachChecksTable)
      .where(eq(securityBreachChecksTable.workspaceId, ctx.workspaceId)),
    db.select({ id: securityTrainingLessonsTable.id })
      .from(securityTrainingLessonsTable)
      .where(eq(securityTrainingLessonsTable.workspaceId, ctx.workspaceId)),
    db.select({ memberId: securityTrainingCompletionsTable.memberId,
                lessonId: securityTrainingCompletionsTable.lessonId })
      .from(securityTrainingCompletionsTable)
      .innerJoin(
        securityTrainingLessonsTable,
        eq(securityTrainingCompletionsTable.lessonId, securityTrainingLessonsTable.id),
      )
      .where(eq(securityTrainingLessonsTable.workspaceId, ctx.workspaceId)),
    db.select({ score: securityPasswordAttestationsTable.score,
                memberId: securityPasswordAttestationsTable.memberId })
      .from(securityPasswordAttestationsTable)
      .innerJoin(
        teamMembersTable,
        eq(securityPasswordAttestationsTable.memberId, teamMembersTable.id),
      )
      .where(eq(teamMembersTable.workspaceId, ctx.workspaceId)),
    db.select().from(securityVendorsTable)
      .where(eq(securityVendorsTable.workspaceId, ctx.workspaceId)),
    db.select({
        id: securityDevicesTable.id,
        mfaEnabled: securityDevicesTable.mfaEnabled,
        diskEncrypted: securityDevicesTable.diskEncrypted,
      })
      .from(securityDevicesTable)
      .innerJoin(teamMembersTable, eq(securityDevicesTable.memberId, teamMembersTable.id))
      .where(eq(teamMembersTable.workspaceId, ctx.workspaceId)),
    db.select({ id: securityIncidentsTable.id })
      .from(securityIncidentsTable)
      .where(and(
        eq(securityIncidentsTable.workspaceId, ctx.workspaceId),
        eq(securityIncidentsTable.status, "open"),
      )),
    db.select().from(securityPhishingCampaignsTable)
      .where(eq(securityPhishingCampaignsTable.workspaceId, ctx.workspaceId))
      .orderBy(desc(securityPhishingCampaignsTable.createdAt))
      .limit(1),
  ]);

  const totalMembers = members.length;
  const totalBreaches = breachChecks.reduce((sum, c) => sum + c.breachCount, 0);
  const breachedMembers = breachChecks.filter((c) => c.breachCount > 0).length;

  // Module scores ─────────────────────────────────────────────────
  // Breach: 100 if no breaches, drop 10 per breached member.
  const breachScore = totalMembers === 0
    ? 100
    : Math.max(0, 100 - breachedMembers * 10);

  // Training: completions / (lessons * activeMembers) * 100
  const required = lessons.length * Math.max(totalMembers, 1);
  const uniqueDone = new Set(completions.map((c) => `${c.memberId}:${c.lessonId}`)).size;
  const trainingScore = required === 0 ? 0 : Math.round((uniqueDone / required) * 100);
  const membersTrained = new Set(completions.map((c) => c.memberId)).size;

  // Password: avg attestation score across team; un-attested members = 0
  const totalScoreSum = attestations.reduce((s, a) => s + a.score, 0);
  const passwordScoreVal = totalMembers === 0
    ? 0
    : Math.round(totalScoreSum / totalMembers);

  // Phishing: based on most recent campaign click rate (lower clicks = higher score)
  let phishingScore = 0;
  let phishingDetail = "Run your first simulation to get a score";
  if (latestCampaign[0]) {
    const results = await db.select()
      .from(securityPhishingResultsTable)
      .where(eq(securityPhishingResultsTable.campaignId, latestCampaign[0].id));
    const total = results.length;
    const clicked = results.filter((r) => r.clickedAt).length;
    if (total > 0) {
      phishingScore = Math.round(((total - clicked) / total) * 100);
      phishingDetail = `Latest: ${clicked}/${total} clicked the bait`;
    }
  }

  // Vendors: % reviewed in last 365 days
  const now = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const reviewedRecently = vendors.filter(
    (v) => v.lastReviewedAt && now - new Date(v.lastReviewedAt).getTime() < oneYearMs,
  ).length;
  const vendorScore = vendors.length === 0
    ? 0
    : Math.round((reviewedRecently / vendors.length) * 100);

  // Devices: % with MFA on AND disk encrypted
  const goodDevices = devices.filter((d) => d.mfaEnabled && d.diskEncrypted).length;
  const deviceScore = devices.length === 0
    ? 0
    : Math.round((goodDevices / devices.length) * 100);

  const moduleScores = [breachScore, trainingScore, passwordScoreVal, vendorScore, deviceScore];
  const includedScores = moduleScores.filter((s, i) => {
    // include phishing only if a campaign exists
    return true;
  });
  const allScores = latestCampaign[0]
    ? [...moduleScores, phishingScore]
    : moduleScores;
  const postureScore = Math.round(
    allScores.reduce((s, n) => s + n, 0) / allScores.length,
  );

  const body = {
    postureScore,
    modules: {
      breach: {
        score: breachScore,
        label: "Breach Exposure",
        detail: totalBreaches === 0
          ? "No leaked credentials found"
          : `${totalBreaches} breach${totalBreaches === 1 ? "" : "es"} across ${breachedMembers} member${breachedMembers === 1 ? "" : "s"}`,
      },
      training: {
        score: trainingScore,
        label: "Training Completion",
        detail: `${uniqueDone} / ${required || 0} lesson completions`,
      },
      phishing: {
        score: phishingScore,
        label: "Phishing Resilience",
        detail: phishingDetail,
      },
      password: {
        score: passwordScoreVal,
        label: "Password Hygiene",
        detail: `${attestations.length} of ${totalMembers} have attested`,
      },
      vendors: {
        score: vendorScore,
        label: "Vendor Risk",
        detail: vendors.length === 0
          ? "No vendors tracked yet"
          : `${reviewedRecently} of ${vendors.length} reviewed in last year`,
      },
      devices: {
        score: deviceScore,
        label: "Device Security",
        detail: devices.length === 0
          ? "No devices logged yet"
          : `${goodDevices} of ${devices.length} have MFA + encryption`,
      },
    },
    counts: {
      openIncidents: openIncidentsRows.length,
      totalBreaches,
      membersTrained,
      totalMembers,
      totalVendors: vendors.length,
      totalDevices: devices.length,
      mfaDevices: devices.filter((d) => d.mfaEnabled).length,
    },
  };

  res.json(GetSecuritySummaryResponse.parse(body));
});

// ─── BREACH CHECKS ───────────────────────────────────────────────
router.get("/security/breach-checks", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Owners only" });
    return;
  }

  const rows = await db
    .select({
      id: securityBreachChecksTable.id,
      memberId: securityBreachChecksTable.memberId,
      memberName: teamMembersTable.name,
      email: securityBreachChecksTable.email,
      breachCount: securityBreachChecksTable.breachCount,
      breaches: securityBreachChecksTable.breaches,
      checkedAt: securityBreachChecksTable.checkedAt,
    })
    .from(securityBreachChecksTable)
    .innerJoin(teamMembersTable, eq(securityBreachChecksTable.memberId, teamMembersTable.id))
    .where(eq(securityBreachChecksTable.workspaceId, ctx.workspaceId))
    .orderBy(desc(securityBreachChecksTable.breachCount));

  res.json(GetSecurityBreachChecksResponse.parse(rows));
});

// XposedOrNot has a free public breach API:
// https://api.xposedornot.com/v1/breach-analytics?email=...
async function queryBreachesForEmail(email: string): Promise<{
  count: number;
  list: Array<{ name: string; date?: string; dataClasses: string[] }>;
}> {
  try {
    const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "RunSafe-Security-Autopilot/1.0" },
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);

    // 404 from XposedOrNot can mean "no breaches" — treat as clean
    if (resp.status === 404) return { count: 0, list: [] };
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "Breach API non-OK response");
      return { count: 0, list: [] };
    }
    const data = (await resp.json()) as {
      ExposedBreaches?: {
        breaches_details?: Array<{
          breach: string;
          xposed_date?: string;
          xposed_data?: string; // semicolon-delimited
        }>;
      };
    };
    const details = data?.ExposedBreaches?.breaches_details ?? [];
    const list = details.map((b) => ({
      name: b.breach,
      date: b.xposed_date ?? null,
      dataClasses: (b.xposed_data ?? "")
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    }));
    return { count: list.length, list: list.map(l => ({ name: l.name, date: l.date ?? undefined, dataClasses: l.dataClasses })) };
  } catch (err) {
    logger.warn({ err }, "Breach API call failed");
    return { count: 0, list: [] };
  }
}

router.post("/security/breach-checks/:memberId/refresh", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Owners only" });
    return;
  }
  const params = RefreshSecurityBreachCheckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid memberId" });
    return;
  }
  const memberId = params.data.memberId;

  const [member] = await db
    .select()
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.id, memberId),
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
    ));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const result = await queryBreachesForEmail(member.email);

  const [existing] = await db
    .select()
    .from(securityBreachChecksTable)
    .where(eq(securityBreachChecksTable.memberId, memberId));

  let saved;
  if (existing) {
    const [row] = await db
      .update(securityBreachChecksTable)
      .set({
        email: member.email,
        breachCount: result.count,
        breaches: result.list,
        checkedAt: new Date(),
      })
      .where(eq(securityBreachChecksTable.id, existing.id))
      .returning();
    saved = row;
  } else {
    const [row] = await db
      .insert(securityBreachChecksTable)
      .values({
        workspaceId: ctx.workspaceId,
        memberId,
        email: member.email,
        breachCount: result.count,
        breaches: result.list,
      })
      .returning();
    saved = row;
  }

  res.json(RefreshSecurityBreachCheckResponse.parse({
    id: saved!.id,
    memberId,
    memberName: member.name,
    email: saved!.email,
    breachCount: saved!.breachCount,
    breaches: saved!.breaches,
    checkedAt: saved!.checkedAt,
  }));
});

// ─── PHISHING ────────────────────────────────────────────────────
router.get("/security/phishing/templates", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  res.json(GetPhishingTemplatesResponse.parse(PHISHING_TEMPLATES));
});

router.get("/security/phishing/campaigns", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }

  const campaigns = await db
    .select({
      id: securityPhishingCampaignsTable.id,
      name: securityPhishingCampaignsTable.name,
      templateKey: securityPhishingCampaignsTable.templateKey,
      createdAt: securityPhishingCampaignsTable.createdAt,
      recipientCount: sql<number>`count(${securityPhishingResultsTable.id})::int`,
      clickCount: sql<number>`count(${securityPhishingResultsTable.clickedAt})::int`,
      reportCount: sql<number>`count(${securityPhishingResultsTable.reportedAt})::int`,
    })
    .from(securityPhishingCampaignsTable)
    .leftJoin(
      securityPhishingResultsTable,
      eq(securityPhishingResultsTable.campaignId, securityPhishingCampaignsTable.id),
    )
    .where(eq(securityPhishingCampaignsTable.workspaceId, ctx.workspaceId))
    .groupBy(securityPhishingCampaignsTable.id)
    .orderBy(desc(securityPhishingCampaignsTable.createdAt));

  const tmplMap = new Map(PHISHING_TEMPLATES.map((t) => [t.key, t.name]));
  const body = campaigns.map((c) => ({
    ...c,
    templateName: tmplMap.get(c.templateKey) ?? c.templateKey,
  }));
  res.json(GetPhishingCampaignsResponse.parse(body));
});

router.post("/security/phishing/campaigns", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const parsed = CreatePhishingCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { name, templateKey, recipientMemberIds } = parsed.data;
  const template = PHISHING_TEMPLATES.find((t) => t.key === templateKey);
  if (!template) {
    res.status(400).json({ error: "Unknown template" });
    return;
  }

  // Verify all recipient ids belong to this workspace
  const validMembers = await db
    .select({ id: teamMembersTable.id, name: teamMembersTable.name, email: teamMembersTable.email })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      inArray(teamMembersTable.id, recipientMemberIds),
    ));
  if (validMembers.length === 0) {
    res.status(400).json({ error: "No valid recipients" });
    return;
  }

  const [campaign] = await db
    .insert(securityPhishingCampaignsTable)
    .values({
      workspaceId: ctx.workspaceId,
      name,
      templateKey,
      createdByClerkId: clerkId,
    })
    .returning();

  const resultRows = await db
    .insert(securityPhishingResultsTable)
    .values(validMembers.map((m) => ({
      campaignId: campaign!.id,
      memberId: m.id,
      token: randomBytes(16).toString("hex"),
    })))
    .returning();

  const memberMap = new Map(validMembers.map((m) => [m.id, m]));
  const results = resultRows.map((r) => {
    const m = memberMap.get(r.memberId)!;
    return {
      id: r.id,
      memberId: r.memberId,
      memberName: m.name,
      memberEmail: m.email,
      token: r.token,
      link: buildPhishLink(r.token),
      clickedAt: r.clickedAt,
      reportedAt: r.reportedAt,
    };
  });

  res.status(201).json({
    id: campaign!.id,
    name: campaign!.name,
    templateKey: campaign!.templateKey,
    template,
    createdAt: campaign!.createdAt,
    results,
  });
});

router.get("/security/phishing/campaigns/:campaignId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = GetPhishingCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const campaignId = params.data.campaignId;
  const [campaign] = await db
    .select()
    .from(securityPhishingCampaignsTable)
    .where(and(
      eq(securityPhishingCampaignsTable.id, campaignId),
      eq(securityPhishingCampaignsTable.workspaceId, ctx.workspaceId),
    ));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  const template = PHISHING_TEMPLATES.find((t) => t.key === campaign.templateKey);
  if (!template) {
    res.status(500).json({ error: "Template missing" });
    return;
  }
  const results = await db
    .select({
      id: securityPhishingResultsTable.id,
      memberId: securityPhishingResultsTable.memberId,
      memberName: teamMembersTable.name,
      memberEmail: teamMembersTable.email,
      token: securityPhishingResultsTable.token,
      clickedAt: securityPhishingResultsTable.clickedAt,
      reportedAt: securityPhishingResultsTable.reportedAt,
    })
    .from(securityPhishingResultsTable)
    .innerJoin(teamMembersTable, eq(securityPhishingResultsTable.memberId, teamMembersTable.id))
    .where(eq(securityPhishingResultsTable.campaignId, campaignId))
    .orderBy(teamMembersTable.name);

  res.json(GetPhishingCampaignResponse.parse({
    id: campaign.id,
    name: campaign.name,
    templateKey: campaign.templateKey,
    template,
    createdAt: campaign.createdAt,
    results: results.map((r) => ({
      ...r,
      link: buildPhishLink(r.token),
    })),
  }));
});

router.delete("/security/phishing/campaigns/:campaignId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = DeletePhishingCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(securityPhishingCampaignsTable)
    .where(and(
      eq(securityPhishingCampaignsTable.id, params.data.campaignId),
      eq(securityPhishingCampaignsTable.workspaceId, ctx.workspaceId),
    ));
  res.status(204).end();
});

// PUBLIC unauth endpoint — records the click and redirects to teaching page
// (Mounted under /api so the same /api router catches it.)
router.get("/phish/:token", async (req, res): Promise<void> => {
  const token = req.params.token;
  if (!token || typeof token !== "string") {
    res.status(400).send("Invalid token");
    return;
  }
  const [result] = await db
    .select()
    .from(securityPhishingResultsTable)
    .where(eq(securityPhishingResultsTable.token, token));
  if (result && !result.clickedAt) {
    await db
      .update(securityPhishingResultsTable)
      .set({ clickedAt: new Date() })
      .where(eq(securityPhishingResultsTable.id, result.id));
  }
  // Redirect to the frontend teaching landing page
  const target = buildLandingUrl(token);
  res.redirect(302, target);
});

// ─── TRAINING ────────────────────────────────────────────────────
router.get("/security/training/lessons", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  await ensureLessonsSeeded(ctx.workspaceId);

  // current member id (for completedByMe)
  const [meRow] = await db
    .select({ id: teamMembersTable.id })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  const myMemberId = meRow?.id;

  const totalMembersRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.status, "active"),
    ));
  const totalMembers = totalMembersRow[0]?.count ?? 0;

  const lessons = await db
    .select({
      id: securityTrainingLessonsTable.id,
      title: securityTrainingLessonsTable.title,
      description: securityTrainingLessonsTable.description,
      category: securityTrainingLessonsTable.category,
      durationMinutes: securityTrainingLessonsTable.durationMinutes,
      completionCount: sql<number>`count(distinct ${securityTrainingCompletionsTable.memberId})::int`,
    })
    .from(securityTrainingLessonsTable)
    .leftJoin(
      securityTrainingCompletionsTable,
      eq(securityTrainingCompletionsTable.lessonId, securityTrainingLessonsTable.id),
    )
    .where(eq(securityTrainingLessonsTable.workspaceId, ctx.workspaceId))
    .groupBy(securityTrainingLessonsTable.id)
    .orderBy(securityTrainingLessonsTable.id);

  let myCompletions = new Set<number>();
  if (myMemberId) {
    const rows = await db
      .select({ lessonId: securityTrainingCompletionsTable.lessonId })
      .from(securityTrainingCompletionsTable)
      .where(eq(securityTrainingCompletionsTable.memberId, myMemberId));
    myCompletions = new Set(rows.map((r) => r.lessonId));
  }

  res.json(GetTrainingLessonsResponse.parse(
    lessons.map((l) => ({
      ...l,
      completedByMe: myCompletions.has(l.id),
      totalMembers,
    })),
  ));
});

router.get("/security/training/lessons/:lessonId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const params = GetTrainingLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [lesson] = await db
    .select()
    .from(securityTrainingLessonsTable)
    .where(and(
      eq(securityTrainingLessonsTable.id, params.data.lessonId),
      eq(securityTrainingLessonsTable.workspaceId, ctx.workspaceId),
    ));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  const [meRow] = await db
    .select({ id: teamMembersTable.id })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  let myScore: number | null = null;
  let completedByMe = false;
  if (meRow) {
    const [c] = await db
      .select()
      .from(securityTrainingCompletionsTable)
      .where(and(
        eq(securityTrainingCompletionsTable.lessonId, lesson.id),
        eq(securityTrainingCompletionsTable.memberId, meRow.id),
      ));
    if (c) {
      completedByMe = true;
      myScore = c.score;
    }
  }
  res.json(GetTrainingLessonResponse.parse({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    category: lesson.category,
    durationMinutes: lesson.durationMinutes,
    steps: lesson.content.steps,
    quiz: lesson.content.quiz,
    completedByMe,
    myScore,
  }));
});

router.post("/security/training/lessons/:lessonId/complete", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const params = CompleteTrainingLessonParams.safeParse(req.params);
  const body = CompleteTrainingLessonBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [meRow] = await db
    .select({ id: teamMembersTable.id })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  if (!meRow) {
    res.status(403).json({ error: "Not a team member" });
    return;
  }
  const [lesson] = await db
    .select({ id: securityTrainingLessonsTable.id })
    .from(securityTrainingLessonsTable)
    .where(and(
      eq(securityTrainingLessonsTable.id, params.data.lessonId),
      eq(securityTrainingLessonsTable.workspaceId, ctx.workspaceId),
    ));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  // Upsert: if already completed, update the score (best-effort)
  const [existing] = await db
    .select()
    .from(securityTrainingCompletionsTable)
    .where(and(
      eq(securityTrainingCompletionsTable.lessonId, lesson.id),
      eq(securityTrainingCompletionsTable.memberId, meRow.id),
    ));
  let saved;
  if (existing) {
    const [row] = await db
      .update(securityTrainingCompletionsTable)
      .set({ score: body.data.score, completedAt: new Date() })
      .where(eq(securityTrainingCompletionsTable.id, existing.id))
      .returning();
    saved = row!;
  } else {
    const [row] = await db
      .insert(securityTrainingCompletionsTable)
      .values({ lessonId: lesson.id, memberId: meRow.id, score: body.data.score })
      .returning();
    saved = row!;
  }
  res.json(CompleteTrainingLessonResponse.parse(saved));
});

// ─── PASSWORD ATTESTATIONS ───────────────────────────────────────
router.get("/security/passwords", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const rows = await db
    .select({
      id: securityPasswordAttestationsTable.id,
      memberId: securityPasswordAttestationsTable.memberId,
      memberName: teamMembersTable.name,
      usesManager: securityPasswordAttestationsTable.usesManager,
      length12Plus: securityPasswordAttestationsTable.length12Plus,
      uniquePerSite: securityPasswordAttestationsTable.uniquePerSite,
      mfaEverywhere: securityPasswordAttestationsTable.mfaEverywhere,
      score: securityPasswordAttestationsTable.score,
      attestedAt: securityPasswordAttestationsTable.attestedAt,
    })
    .from(securityPasswordAttestationsTable)
    .innerJoin(teamMembersTable, eq(securityPasswordAttestationsTable.memberId, teamMembersTable.id))
    .where(eq(teamMembersTable.workspaceId, ctx.workspaceId))
    .orderBy(desc(securityPasswordAttestationsTable.score));
  res.json(GetPasswordAttestationsResponse.parse(rows));
});

router.get("/security/passwords/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const [meRow] = await db
    .select({ id: teamMembersTable.id, name: teamMembersTable.name })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  if (!meRow) {
    res.json(null);
    return;
  }
  const [att] = await db
    .select()
    .from(securityPasswordAttestationsTable)
    .where(eq(securityPasswordAttestationsTable.memberId, meRow.id));
  if (!att) {
    res.json(null);
    return;
  }
  res.json(GetMyPasswordAttestationResponse.parse({
    ...att,
    memberName: meRow.name,
  }));
});

router.put("/security/passwords/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const body = UpsertMyPasswordAttestationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [meRow] = await db
    .select({ id: teamMembersTable.id, name: teamMembersTable.name })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  if (!meRow) {
    res.status(403).json({ error: "Not a team member" });
    return;
  }
  const score = passwordScore(body.data);
  const values = {
    memberId: meRow.id,
    usesManager: body.data.usesManager,
    length12Plus: body.data.length12Plus,
    uniquePerSite: body.data.uniquePerSite,
    mfaEverywhere: body.data.mfaEverywhere,
    score,
    attestedAt: new Date(),
  };
  const [existing] = await db
    .select()
    .from(securityPasswordAttestationsTable)
    .where(eq(securityPasswordAttestationsTable.memberId, meRow.id));
  let saved;
  if (existing) {
    const [r] = await db
      .update(securityPasswordAttestationsTable)
      .set(values)
      .where(eq(securityPasswordAttestationsTable.id, existing.id))
      .returning();
    saved = r!;
  } else {
    const [r] = await db
      .insert(securityPasswordAttestationsTable)
      .values(values)
      .returning();
    saved = r!;
  }
  res.json(UpsertMyPasswordAttestationResponse.parse({
    ...saved,
    memberName: meRow.name,
  }));
});

// ─── PLAYBOOKS & INCIDENTS ───────────────────────────────────────
router.get("/security/playbooks", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  await ensurePlaybooksSeeded(ctx.workspaceId);
  const rows = await db
    .select({
      id: securityPlaybooksTable.id,
      title: securityPlaybooksTable.title,
      category: securityPlaybooksTable.category,
      severity: securityPlaybooksTable.severity,
      description: securityPlaybooksTable.description,
      stepCount: sql<number>`coalesce(jsonb_array_length(${securityPlaybooksTable.steps}), 0)::int`,
    })
    .from(securityPlaybooksTable)
    .where(eq(securityPlaybooksTable.workspaceId, ctx.workspaceId))
    .orderBy(securityPlaybooksTable.severity, securityPlaybooksTable.id);
  res.json(GetPlaybooksResponse.parse(rows));
});

router.get("/security/playbooks/:playbookId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = GetPlaybookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [pb] = await db
    .select()
    .from(securityPlaybooksTable)
    .where(and(
      eq(securityPlaybooksTable.id, params.data.playbookId),
      eq(securityPlaybooksTable.workspaceId, ctx.workspaceId),
    ));
  if (!pb) {
    res.status(404).json({ error: "Playbook not found" });
    return;
  }
  res.json(GetPlaybookResponse.parse(pb));
});

router.get("/security/incidents", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const rows = await db
    .select({
      id: securityIncidentsTable.id,
      playbookId: securityIncidentsTable.playbookId,
      playbookTitle: securityPlaybooksTable.title,
      playbookSeverity: securityPlaybooksTable.severity,
      title: securityIncidentsTable.title,
      status: securityIncidentsTable.status,
      openedByName: securityIncidentsTable.openedByName,
      notes: securityIncidentsTable.notes,
      completedStepIndices: securityIncidentsTable.completedStepIndices,
      openedAt: securityIncidentsTable.openedAt,
      resolvedAt: securityIncidentsTable.resolvedAt,
    })
    .from(securityIncidentsTable)
    .innerJoin(securityPlaybooksTable, eq(securityIncidentsTable.playbookId, securityPlaybooksTable.id))
    .where(eq(securityIncidentsTable.workspaceId, ctx.workspaceId))
    .orderBy(desc(securityIncidentsTable.openedAt));
  res.json(GetIncidentsResponse.parse(rows));
});

router.post("/security/incidents", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const body = CreateIncidentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [pb] = await db
    .select()
    .from(securityPlaybooksTable)
    .where(and(
      eq(securityPlaybooksTable.id, body.data.playbookId),
      eq(securityPlaybooksTable.workspaceId, ctx.workspaceId),
    ));
  if (!pb) {
    res.status(400).json({ error: "Playbook not found" });
    return;
  }
  const [meRow] = await db
    .select({ name: teamMembersTable.name })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  const ownerName = meRow?.name ?? "Owner";
  const [row] = await db
    .insert(securityIncidentsTable)
    .values({
      workspaceId: ctx.workspaceId,
      playbookId: pb.id,
      title: body.data.title,
      status: "open",
      openedByClerkId: clerkId,
      openedByName: ownerName,
      notes: body.data.notes ?? null,
    })
    .returning();
  res.status(201).json({
    ...row!,
    playbookTitle: pb.title,
    playbookSeverity: pb.severity,
  });
});

router.patch("/security/incidents/:incidentId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = UpdateIncidentParams.safeParse(req.params);
  const body = UpdateIncidentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [existing] = await db
    .select()
    .from(securityIncidentsTable)
    .where(and(
      eq(securityIncidentsTable.id, params.data.incidentId),
      eq(securityIncidentsTable.workspaceId, ctx.workspaceId),
    ));
  if (!existing) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (body.data.status !== undefined) {
    updates.status = body.data.status;
    updates.resolvedAt = body.data.status === "resolved" ? new Date() : null;
  }
  if (body.data.notes !== undefined) updates.notes = body.data.notes;
  if (body.data.completedStepIndices !== undefined) {
    updates.completedStepIndices = body.data.completedStepIndices;
  }
  const [row] = await db
    .update(securityIncidentsTable)
    .set(updates)
    .where(eq(securityIncidentsTable.id, existing.id))
    .returning();
  const [pb] = await db
    .select({ title: securityPlaybooksTable.title, severity: securityPlaybooksTable.severity })
    .from(securityPlaybooksTable)
    .where(eq(securityPlaybooksTable.id, row!.playbookId));
  res.json(UpdateIncidentResponse.parse({
    ...row!,
    playbookTitle: pb!.title,
    playbookSeverity: pb!.severity,
  }));
});

// ─── VENDORS ─────────────────────────────────────────────────────
router.get("/security/vendors", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const rows = await db
    .select()
    .from(securityVendorsTable)
    .where(eq(securityVendorsTable.workspaceId, ctx.workspaceId))
    .orderBy(securityVendorsTable.name);
  res.json(GetVendorsResponse.parse(rows));
});

router.post("/security/vendors", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const body = CreateVendorBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(securityVendorsTable)
    .values({
      workspaceId: ctx.workspaceId,
      name: body.data.name,
      category: body.data.category ?? "saas",
      dataAccess: body.data.dataAccess,
      hasMfa: body.data.hasMfa ?? false,
      hasSso: body.data.hasSso ?? false,
      notes: body.data.notes ?? null,
      lastReviewedAt: new Date(),
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/security/vendors/:vendorId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = UpdateVendorParams.safeParse(req.params);
  const body = UpdateVendorBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [existing] = await db
    .select()
    .from(securityVendorsTable)
    .where(and(
      eq(securityVendorsTable.id, params.data.vendorId),
      eq(securityVendorsTable.workspaceId, ctx.workspaceId),
    ));
  if (!existing) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const k of ["name", "category", "dataAccess", "hasMfa", "hasSso", "notes"] as const) {
    if (body.data[k] !== undefined) updates[k] = body.data[k];
  }
  if (body.data.markReviewed) updates.lastReviewedAt = new Date();
  const [row] = await db
    .update(securityVendorsTable)
    .set(updates)
    .where(eq(securityVendorsTable.id, existing.id))
    .returning();
  res.json(UpdateVendorResponse.parse(row));
});

router.delete("/security/vendors/:vendorId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx || ctx.role !== "owner") {
    res.status(ctx ? 403 : 404).json({ error: ctx ? "Owners only" : "Workspace not found" });
    return;
  }
  const params = DeleteVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(securityVendorsTable)
    .where(and(
      eq(securityVendorsTable.id, params.data.vendorId),
      eq(securityVendorsTable.workspaceId, ctx.workspaceId),
    ));
  res.status(204).end();
});

// ─── DEVICES ─────────────────────────────────────────────────────
router.get("/security/devices", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const baseQuery = db
    .select({
      id: securityDevicesTable.id,
      memberId: securityDevicesTable.memberId,
      memberName: teamMembersTable.name,
      name: securityDevicesTable.name,
      type: securityDevicesTable.type,
      os: securityDevicesTable.os,
      mfaEnabled: securityDevicesTable.mfaEnabled,
      diskEncrypted: securityDevicesTable.diskEncrypted,
      autoUpdates: securityDevicesTable.autoUpdates,
      notes: securityDevicesTable.notes,
      updatedAt: securityDevicesTable.updatedAt,
    })
    .from(securityDevicesTable)
    .innerJoin(teamMembersTable, eq(securityDevicesTable.memberId, teamMembersTable.id))
    .where(eq(teamMembersTable.workspaceId, ctx.workspaceId))
    .orderBy(teamMembersTable.name, securityDevicesTable.name);

  if (ctx.role === "owner") {
    const rows = await baseQuery;
    res.json(GetDevicesResponse.parse(rows));
    return;
  }

  // Member: only own devices
  const [meRow] = await db
    .select({ id: teamMembersTable.id })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  if (!meRow) {
    res.json([]);
    return;
  }
  const rows = await db
    .select({
      id: securityDevicesTable.id,
      memberId: securityDevicesTable.memberId,
      memberName: teamMembersTable.name,
      name: securityDevicesTable.name,
      type: securityDevicesTable.type,
      os: securityDevicesTable.os,
      mfaEnabled: securityDevicesTable.mfaEnabled,
      diskEncrypted: securityDevicesTable.diskEncrypted,
      autoUpdates: securityDevicesTable.autoUpdates,
      notes: securityDevicesTable.notes,
      updatedAt: securityDevicesTable.updatedAt,
    })
    .from(securityDevicesTable)
    .innerJoin(teamMembersTable, eq(securityDevicesTable.memberId, teamMembersTable.id))
    .where(eq(securityDevicesTable.memberId, meRow.id))
    .orderBy(securityDevicesTable.name);
  res.json(GetDevicesResponse.parse(rows));
});

router.post("/security/devices", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const body = CreateDeviceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [meRow] = await db
    .select({ id: teamMembersTable.id, name: teamMembersTable.name })
    .from(teamMembersTable)
    .where(and(
      eq(teamMembersTable.workspaceId, ctx.workspaceId),
      eq(teamMembersTable.clerkId, clerkId),
    ));
  let memberId: number | undefined = meRow?.id;
  let memberName = meRow?.name;
  if (body.data.memberId !== undefined) {
    if (ctx.role !== "owner") {
      res.status(403).json({ error: "Only owners can assign devices to other members" });
      return;
    }
    const [other] = await db
      .select({ id: teamMembersTable.id, name: teamMembersTable.name })
      .from(teamMembersTable)
      .where(and(
        eq(teamMembersTable.id, body.data.memberId),
        eq(teamMembersTable.workspaceId, ctx.workspaceId),
      ));
    if (!other) {
      res.status(400).json({ error: "Target member not in workspace" });
      return;
    }
    memberId = other.id;
    memberName = other.name;
  }
  if (!memberId || !memberName) {
    res.status(403).json({ error: "Not a team member" });
    return;
  }
  const [row] = await db
    .insert(securityDevicesTable)
    .values({
      memberId,
      name: body.data.name,
      type: body.data.type,
      os: body.data.os ?? null,
      mfaEnabled: body.data.mfaEnabled ?? false,
      diskEncrypted: body.data.diskEncrypted ?? false,
      autoUpdates: body.data.autoUpdates ?? false,
      notes: body.data.notes ?? null,
    })
    .returning();
  res.status(201).json({ ...row!, memberName });
});

router.patch("/security/devices/:deviceId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const params = UpdateDeviceParams.safeParse(req.params);
  const body = UpdateDeviceBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  // Authorization: owner OR the device's member
  const [existing] = await db
    .select({
      d: securityDevicesTable,
      memberWorkspace: teamMembersTable.workspaceId,
      memberClerkId: teamMembersTable.clerkId,
      memberName: teamMembersTable.name,
    })
    .from(securityDevicesTable)
    .innerJoin(teamMembersTable, eq(securityDevicesTable.memberId, teamMembersTable.id))
    .where(eq(securityDevicesTable.id, params.data.deviceId));
  if (!existing || existing.memberWorkspace !== ctx.workspaceId) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (ctx.role !== "owner" && existing.memberClerkId !== clerkId) {
    res.status(403).json({ error: "Cannot edit another member's device" });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const k of ["name", "type", "os", "mfaEnabled", "diskEncrypted", "autoUpdates", "notes"] as const) {
    if (body.data[k] !== undefined) updates[k] = body.data[k];
  }
  const [row] = await db
    .update(securityDevicesTable)
    .set(updates)
    .where(eq(securityDevicesTable.id, existing.d.id))
    .returning();
  res.json(UpdateDeviceResponse.parse({ ...row!, memberName: existing.memberName }));
});

router.delete("/security/devices/:deviceId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  const params = DeleteDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db
    .select({
      d: securityDevicesTable,
      memberWorkspace: teamMembersTable.workspaceId,
      memberClerkId: teamMembersTable.clerkId,
    })
    .from(securityDevicesTable)
    .innerJoin(teamMembersTable, eq(securityDevicesTable.memberId, teamMembersTable.id))
    .where(eq(securityDevicesTable.id, params.data.deviceId));
  if (!existing || existing.memberWorkspace !== ctx.workspaceId) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  if (ctx.role !== "owner" && existing.memberClerkId !== clerkId) {
    res.status(403).json({ error: "Cannot delete another member's device" });
    return;
  }
  await db.delete(securityDevicesTable).where(eq(securityDevicesTable.id, existing.d.id));
  res.status(204).end();
});

export default router;
