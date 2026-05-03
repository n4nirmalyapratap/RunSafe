import { eq } from "drizzle-orm";
import { db, workspacesTable, teamMembersTable } from "@workspace/db";

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceContext {
  workspaceId: number;
  role: WorkspaceRole;
  memberId?: number;
  plan: string;
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
    return { workspaceId: ownerWs.id, role: "owner", plan: ownerWs.plan };
  }

  const [member] = await db
    .select({
      memberId: teamMembersTable.id,
      workspaceId: teamMembersTable.workspaceId,
    })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.clerkId, clerkId));

  if (member) {
    const [ws] = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, member.workspaceId));

    if (ws) {
      return {
        workspaceId: ws.id,
        role: "member",
        memberId: member.memberId,
        plan: ws.plan,
      };
    }
  }

  return null;
}
