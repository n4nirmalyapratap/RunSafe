import { eq, and, isNull, ne } from "drizzle-orm";
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
 *     – if team_members.role = "owner", returns role:"owner" so invited
 *       owners get the same access level as the primary workspace owner.
 *  3. Email-based auto-link: if the user's Clerk email matches a pending
 *     team_members.email with clerkId = null, link them and return context.
 * Returns null if the user has no workspace affiliation.
 */
export async function getWorkspaceContext(
  clerkId: string,
): Promise<WorkspaceContext | null> {
  // 1. Primary owner check
  const [ownerWs] = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.ownerClerkId, clerkId));

  if (ownerWs) {
    return { workspaceId: ownerWs.id, role: "owner", plan: ownerWs.plan };
  }

  // 2. Already-linked team member check
  const [member] = await db
    .select({
      memberId: teamMembersTable.id,
      workspaceId: teamMembersTable.workspaceId,
      memberRole: teamMembersTable.role,
    })
    .from(teamMembersTable)
    .where(
      and(
        eq(teamMembersTable.clerkId, clerkId),
        // Disabled members must not regain access via existing clerk link.
        ne(teamMembersTable.status, "disabled"),
      ),
    );

  if (member) {
    const [ws] = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, member.workspaceId));

    if (ws) {
      // Invited team members with role="owner" receive full owner-level access
      const resolvedRole: WorkspaceRole =
        member.memberRole === "owner" ? "owner" : "member";
      return {
        workspaceId: ws.id,
        role: resolvedRole,
        memberId: member.memberId,
        plan: ws.plan,
      };
    }
  }

  // 3. Email-based auto-link for invited members whose clerkId is not yet set
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses
      .find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress?.trim()
      .toLowerCase();

    if (primaryEmail) {
      const [unlinked] = await db
        .select()
        .from(teamMembersTable)
        .where(
          and(
            eq(teamMembersTable.email, primaryEmail),
            isNull(teamMembersTable.clerkId),
            // Don't auto-link a disabled invite — the owner removed them.
            ne(teamMembersTable.status, "disabled"),
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
          const resolvedRole: WorkspaceRole =
            unlinked.role === "owner" ? "owner" : "member";
          return {
            workspaceId: ws.id,
            role: resolvedRole,
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
