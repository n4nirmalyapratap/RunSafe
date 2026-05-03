import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, workspacesTable } from "@workspace/db";
import {
  GetWorkspaceResponse,
  CreateWorkspaceBody,
  UpdateWorkspaceBody,
  UpdateWorkspaceResponse,
} from "@workspace/api-zod";
import { requireAuth, getClerkUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const [workspace] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));

  if (!workspace) {
    res.status(404).json({ error: "No workspace found" });
    return;
  }

  res.json(GetWorkspaceResponse.parse(workspace));
});

router.post("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const parsed = CreateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workspace] = await db
    .insert(workspacesTable)
    .values({ ...parsed.data, ownerClerkId: clerkId, plan: "starter" })
    .returning();

  res.status(201).json(GetWorkspaceResponse.parse(workspace));
});

router.patch("/workspace", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req);
  const parsed = UpdateWorkspaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workspace] = await db
    .update(workspacesTable)
    .set(parsed.data)
    .where(eq(workspacesTable.ownerClerkId, clerkId))
    .returning();

  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  res.json(UpdateWorkspaceResponse.parse(workspace));
});

export default router;
