# RunSafe — Workspace

## Overview

RunSafe is a full-stack SaaS web app for SMB owners combining:
- **Delegation OS** — SOP creation, team assignment, task tracking
- **Compliance Autopilot** — regulatory checklists, deadline alerts, audit trail (Growth/Pro plans only)

Built as a pnpm monorepo using TypeScript throughout.

## Tiered Pricing

| Plan | Price | Features |
|------|-------|----------|
| Starter | $29/mo | Delegation OS only (SOPs, Tasks, Team) |
| Growth | $79/mo | + Compliance Autopilot, Audit Trail |
| Pro | $149/mo | + Unlimited members, multi-location, dedicated support |

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `artifacts/runsafe`) — Wouter routing, Tailwind CSS v4, shadcn/ui
- **Backend**: Express 5 TypeScript (artifact: `artifacts/api-server`) — port 8080
- **Auth**: Clerk (`@clerk/react`, `@clerk/express`) — appId: `app_3DBpZMugo86r9RIcoUXBa39etTO`
- **Database**: PostgreSQL + Drizzle ORM (lib: `lib/db`)
- **API Spec**: OpenAPI YAML → Orval codegen → React Query hooks + Zod schemas
- **Validation**: Zod v4, drizzle-zod
- **Build**: esbuild

## Monorepo Structure

```
artifacts/
  api-server/         # Express backend (port 8080)
  runsafe/            # React+Vite frontend (port from $PORT env)
  mockup-sandbox/     # Canvas component preview server
lib/
  api-client-react/   # Generated React Query hooks (via Orval)
  api-zod/            # Generated Zod request/response schemas
  api-spec/           # OpenAPI spec + Orval config
  db/                 # Drizzle schema + migrations
```

## Database Schema

Tables: `workspaces`, `team_members`, `sops`, `sop_steps`, `task_assignments`, `task_step_completions`, `compliance_items`, `compliance_completions`

## Compliance reminders

The dashboard surfaces the next upcoming compliance deadline (with overdue/due-soon styling), and the sidebar shows a red badge with the count of overdue compliance items.

A daily cron-callable endpoint dispatches deadline reminder emails:
- Endpoint: `POST /api/compliance/send-reminders`
- Auth: `Authorization: Bearer $REMINDER_CRON_TOKEN`
- Behavior: scans non-completed compliance items and emails the workspace owner when `dueDate` is exactly 7 or 1 day away (also today). Per-due-date dedupe is stored on the row (`reminder_7_sent_for_due_date`, `reminder_1_sent_for_due_date`).
- Email transport: uses Resend if `RESEND_API_KEY` is set (configurable `REMINDER_FROM_EMAIL`); otherwise logs to the API server's pino logger.
- Recurring items (`monthly`/`quarterly`/`annually`) auto-advance their due date and reset reminder markers when marked complete.
- Cron driver: `pnpm --filter @workspace/scripts run send-compliance-reminders`, suitable for a Replit Scheduled Deployment. Required envs for the script: `REMINDER_API_URL`, `REMINDER_CRON_TOKEN`.

Demo seed data: "Green Leaf Cafe" workspace (ownerClerkId: "demo_seed_owner"), 3 team members, 3 SOPs, tasks, compliance items.

## Key API Routes (all under /api prefix)

- `GET/POST /api/workspace` — workspace CRUD
- `GET/POST/PATCH/DELETE /api/sops` — SOP management
- `POST /api/sops/:id/steps` — add steps
- `POST /api/sops/:id/assign` — assign SOP to team member
- `GET/PATCH /api/tasks` — task assignments
- `GET/POST/PATCH/DELETE /api/compliance` — compliance items
- `POST /api/compliance/:id/complete` — mark compliance done
- `GET /api/team` — team members (invite/remove)
- `GET /api/dashboard/summary` — dashboard metrics
- `GET /api/healthz` — health check

## Frontend Routes

- `/` — Landing page (public) with hero, features, pricing
- `/sign-in`, `/sign-up` — Clerk auth pages
- `/onboarding` — New user workspace setup form
- `/dashboard` — Dashboard with stat cards
- `/sops` — SOP library grid
- `/sops/:id` — SOP detail with steps and assign button
- `/tasks` — Task assignments (Pending / In Progress / Completed tabs)
- `/compliance` — Compliance checklist (Starter plan shows upgrade prompt)
- `/team` — Team members table
- `/settings` — Workspace settings + plan info

## Architecture Notes

- Vite dev server proxies `/api/*` to `localhost:8080` (set in `vite.config.ts`)
- New users without a workspace are redirected to `/onboarding` (detected by 404 status on GET /api/workspace)
- Clerk proxy middleware (`/api/__clerk`) only active in production
- `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` are set as secrets
- `DATABASE_URL` is set for PostgreSQL access

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run seed` — seed demo data
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
