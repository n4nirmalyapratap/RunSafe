import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, teamMembersTable } from "@workspace/db";
import {
  GetTeamMembersResponse,
  InviteTeamMemberBody,
  UpdateTeamMemberParams,
  UpdateTeamMemberBody,
  UpdateTeamMemberResponse,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";
import { createClerkClient } from "@clerk/express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Best-effort: send a Clerk invitation email to the invited team member.
 * On success the member receives a sign-up link; on sign-up the
 * email-based auto-link in getWorkspaceContext links them to the workspace.
 * Failure is non-fatal — the team_members row still exists, and the user
 * can sign up directly with the same email and be auto-linked.
 */
async function sendInviteEmail(email: string): Promise<{ sent: boolean; error?: string }> {
  try {
    const appOrigin =
      process.env.RUNSAFE_APP_ORIGIN ||
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null);
    const redirectUrl = appOrigin ? `${appOrigin}/sign-up` : undefined;

    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl,
      ignoreExisting: true,
    });
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Use the structured logger so this surfaces with request context in
    // production rather than going to bare stdout.
    logger.warn({ email, err: msg }, "[team] Clerk invitation email failed");
    return { sent: false, error: msg };
  }
}

router.get("/team", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can view team members" });
    return;
  }

  const members = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.workspaceId, ctx.workspaceId));

  res.json(GetTeamMembersResponse.parse(members));
});

router.post("/team", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can invite team members" });
    return;
  }

  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Normalize email to lowercase to keep insert + auto-link match consistent.
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const [member] = await db
    .insert(teamMembersTable)
    .values({
      workspaceId: ctx.workspaceId,
      email: normalizedEmail,
      name: parsed.data.name,
      role: parsed.data.role ?? "employee",
      status: "invited",
    })
    .returning();

  // Fire the Clerk invitation email (best-effort) and surface delivery
  // status to the caller so the UI can warn when it fails.
  const invite = await sendInviteEmail(normalizedEmail);

  res.status(201).json({ ...member, inviteSent: invite.sent });
});

router.patch("/team/:memberId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can update team members" });
    return;
  }

  const params = UpdateTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .update(teamMembersTable)
    .set(parsed.data)
    .where(
      and(
        eq(teamMembersTable.id, params.data.memberId),
        eq(teamMembersTable.workspaceId, ctx.workspaceId),
      ),
    )
    .returning();

  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  res.json(UpdateTeamMemberResponse.parse(member));
});

router.delete("/team/:memberId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);
  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }
  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can remove team members" });
    return;
  }

  const params = RemoveTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(teamMembersTable)
    .where(
      and(
        eq(teamMembersTable.id, params.data.memberId),
        eq(teamMembersTable.workspaceId, ctx.workspaceId),
      ),
    );

  res.sendStatus(204);
});

export default router;
