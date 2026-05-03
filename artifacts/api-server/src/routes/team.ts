import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, workspacesTable, teamMembersTable } from "@workspace/db";
import {
  GetTeamMembersResponse,
  InviteTeamMemberBody,
  UpdateTeamMemberParams,
  UpdateTeamMemberBody,
  UpdateTeamMemberResponse,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getWorkspaceId(clerkId: string): Promise<number | null> {
  const [ws] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));
  return ws?.id ?? null;
}

router.get("/team", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.json([]);
    return;
  }

  const members = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.workspaceId, workspaceId));

  res.json(GetTeamMembersResponse.parse(members));
});

router.post("/team", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const parsed = InviteTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .insert(teamMembersTable)
    .values({
      workspaceId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role ?? "employee",
      status: "invited",
    })
    .returning();

  res.status(201).json(member);
});

router.patch("/team/:memberId", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
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
        eq(teamMembersTable.workspaceId, workspaceId),
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
  const workspaceId = await getWorkspaceId(clerkId);
  if (!workspaceId) {
    res.status(404).json({ error: "Workspace not found" });
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
        eq(teamMembersTable.workspaceId, workspaceId),
      ),
    );

  res.sendStatus(204);
});

export default router;
