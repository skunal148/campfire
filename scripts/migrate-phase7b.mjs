import postgres from "postgres";

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) {
  console.error("SUPABASE_DB_PASSWORD not set");
  process.exit(1);
}

const projectRef = "twzbznafhboywtkkteis";
const sql = postgres({
  host: "aws-1-ap-south-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  username: `postgres.${projectRef}`,
  password: dbPassword,
  ssl: "require",
});

async function migrate() {
  console.log("Running Phase 7b migration (global admin)...\n");

  // Add is_global_admin column to profiles
  console.log("Adding is_global_admin column to profiles...");
  await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_global_admin boolean DEFAULT false`;
  console.log("   Done.\n");

  // Set kunal.shinde@shubhztechwork.com as global admin
  console.log("Setting global admin...");
  const result = await sql`
    UPDATE public.profiles
    SET is_global_admin = true
    WHERE id = (
      SELECT id FROM auth.users WHERE email = 'kunal.shinde@shubhztechwork.com' LIMIT 1
    )
  `;
  console.log(`   Updated ${result.count} row(s).\n`);

  console.log("Phase 7b migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
