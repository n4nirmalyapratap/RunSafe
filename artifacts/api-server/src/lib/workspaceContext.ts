import { eq } from "drizzle-orm";
import { db, workspacesTable, teamMembersTable } from "@workspace/db";

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceContext {
  workspaceId: number;
  role: WorkspaceRole;
  memberId?: number;
}

/**
 * Resolve the workspace context for a given Clerk user ID.
 * Checks owner first, then falls back to team member (via clerkId).
 * Returns null if the user has no workspace affiliation.
 */
export async function getWorkspaceContext(
  clerkId: string,
): Promise<WorkspaceContext | null> {
  const [ownerWs] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));

  if (ownerWs) {
    return { workspaceId: ownerWs.id, role: "owner" };
  }

  const [member] = await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.clerkId, clerkId));

  if (member) {
    return { workspaceId: member.workspaceId, role: "member", memberId: member.id };
  }

  return null;
}
