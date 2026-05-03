import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workspacesTable, complianceItemsTable } from "@workspace/db";
import {
  GetWorkspaceResponse,
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
  UpdateWorkspaceResponse,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";
import { getWorkspaceContext } from "../lib/workspaceContext";
import { resolveComplianceTemplates } from "../lib/complianceCatalog";

const router: IRouter = Router();

router.get("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);

  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, ctx.workspaceId));

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.json(GetWorkspaceResponse.parse({ ...workspace, userRole: ctx.role }));
});

router.post("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);

  const existing = await getWorkspaceContext(clerkId);
  if (existing) {
    res.status(409).json({ error: "Workspace already exists" });
    return;
  }

  const parsed = CreateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workspace] = await db
    .insert(workspacesTable)
    .values({ ...parsed.data, ownerClerkId: clerkId, plan: "starter" })
    .returning();

  // Auto-seed compliance items based on the workspace's country/state/industry.
  // Best-effort: any failure here is non-fatal — the owner can re-seed from the
  // Compliance page later.
  try {
    const templates = resolveComplianceTemplates({
      country: workspace.country,
      state: workspace.state,
      industry: workspace.industry,
    });
    if (templates.length > 0) {
      await db.insert(complianceItemsTable).values(
        templates.map((t) => ({
          workspaceId: workspace.id,
          title: t.title,
          description: t.description,
          category: t.category,
          recurrence: t.recurrence,
          dueDate: t.dueDate ?? undefined,
          status: "pending",
        })),
      );
    }
  } catch (err) {
    console.error("[workspace] auto-seed compliance failed", err);
  }

  res.status(201).json(GetWorkspaceResponse.parse({ ...workspace, userRole: "owner" }));
});

router.patch("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const ctx = await getWorkspaceContext(clerkId);

  if (!ctx) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  if (ctx.role !== "owner") {
    res.status(403).json({ error: "Only workspace owners can update workspace settings" });
    return;
  }

  const parsed = UpdateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workspace] = await db
    .update(workspacesTable)
    .set(parsed.data)
    .where(eq(workspacesTable.id, ctx.workspaceId))
    .returning();

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.json(UpdateWorkspaceResponse.parse({ ...workspace, userRole: ctx.role }));
});

export default router;
