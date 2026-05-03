import pg from "pg";
import crypto from "node:crypto";

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!CLERK_SECRET || !DB_URL) {
  console.error("Missing CLERK_SECRET_KEY or DATABASE_URL");
  process.exit(1);
}

const stamp = Date.now().toString(36);
const email = `runsafe-owner-${stamp}@example.com`;
const password = `Run${crypto.randomBytes(9).toString("base64url")}!9`;

console.log("Creating Clerk user:", email);
const createResp = await fetch("https://api.clerk.com/v1/users", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${CLERK_SECRET}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email_address: [email],
    password,
    first_name: "RunSafe",
    last_name: "Owner",
    skip_password_checks: false,
    skip_password_requirement: false,
  }),
});
if (!createResp.ok) {
  console.error("Clerk create failed:", createResp.status, await createResp.text());
  process.exit(1);
}
const user = await createResp.json();
const clerkId = user.id;
console.log("Clerk user id:", clerkId);

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
const ws = await client.query(
  `INSERT INTO workspaces (name, industry, owner_clerk_id, plan)
   VALUES ($1, $2, $3, 'pro') RETURNING id, name, plan`,
  ["RunSafe Demo Workspace", "general", clerkId],
);
const workspaceId = ws.rows[0].id;
console.log("Workspace:", ws.rows[0]);

const PREBUILT = [
  ["Workers' Compensation Insurance", "Verify workers' compensation insurance is current.", "employment", "annually"],
  ["Wage & Hour Compliance Audit", "Review pay rates, overtime, and break policies.", "employment", "annually"],
  ["Fire Extinguisher Inspection", "Ensure all fire extinguishers are inspected and tagged.", "health_safety", "annually"],
  ["First Aid Kit Restocking", "Check and restock first aid kits.", "health_safety", "quarterly"],
  ["Business License Renewal", "Renew local business operating license.", "licensing", "annually"],
  ["Food Handler Certifications", "Ensure all staff hold valid certifications.", "licensing", "annually"],
  ["Customer Data Review", "Audit personal customer data collection and access.", "data_privacy", "annually"],
];
for (const [title, description, category, recurrence] of PREBUILT) {
  await client.query(
    `INSERT INTO compliance_items (workspace_id, title, description, category, recurrence, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [workspaceId, title, description, category, recurrence],
  );
}
console.log("Seeded", PREBUILT.length, "compliance items");

await client.end();

console.log("\n=========================================");
console.log("  RunSafe demo account created");
console.log("=========================================");
console.log("  Email:    ", email);
console.log("  Password: ", password);
console.log("  Plan:     ", "pro (full access)");
console.log("=========================================\n");
