import { eq, and, isNull } from "drizzle-orm";
import { db, workspacesTable, teamMembersTable } from "@workspace/db";
import { createClerkClient } from "@clerk/express";

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceContext {
  workspaceId: number;
  role: WorkspaceRole;
  memberId?: number;
  plan: string;
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Resolve the workspace context for a given Clerk user ID.
 * Priority:
 *  1. Owner match via workspaces.ownerClerkId
 *  2. Member match via team_members.clerkId (already linked)
 *  3. Email-based auto-link: if the user's Clerk email matches a pending
 *     team_members.email with clerkId = null, link them and return member ctx.
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

  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    if (primaryEmail) {
      const [unlinked] = await db
        .select()
        .from(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.email, primaryEmail),
            isNull(teamMembersTable.clerkId),
          ),
        );

      if (unlinked) {
        await db
          .update(teamMembersTable)
          .set({ clerkId, status: "active" })
          .where(eq(teamMembersTable.id, unlinked.id));

        const [ws] = await db
          .select()
          .from(workspacesTable)
          .where(eq(workspacesTable.id, unlinked.workspaceId));

        if (ws) {
          return {
            workspaceId: ws.id,
            role: "member",
            memberId: unlinked.id,
            plan: ws.plan,
          };
        }
      }
    }
  } catch {
    // Clerk lookup failure is non-fatal; fall through to null
  }

  return null;
}
