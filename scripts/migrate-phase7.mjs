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
  console.log("Running Phase 7 migration...\n");

  // Add archived_at column to channels
  console.log("Adding archived_at column to channels...");
  await sql`ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS archived_at timestamptz`;
  console.log("   Done.\n");

  // RLS: only owner can archive
  console.log("Adding archive RLS policy...");
  await sql`DROP POLICY IF EXISTS "Owner can archive channel" ON public.channels`;
  await sql`
    CREATE POLICY "Owner can archive channel" ON public.channels
      FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = channels.id AND cm.user_id = auth.uid() AND cm.role = 'owner'
      ))
  `;
  console.log("   Done.\n");

  // RLS: owner/admin can remove members
  console.log("Adding member removal RLS policy...");
  await sql`DROP POLICY IF EXISTS "Admin can remove members" ON public.channel_members`;
  await sql`
    CREATE POLICY "Admin can remove members" ON public.channel_members
      FOR DELETE USING (
        user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.channel_members cm2
          WHERE cm2.channel_id = channel_members.channel_id
            AND cm2.user_id = auth.uid()
            AND cm2.role IN ('owner', 'admin')
        )
      )
  `;
  console.log("   Done.\n");

  // RLS: owner can update member roles
  console.log("Adding role update RLS policy...");
  await sql`DROP POLICY IF EXISTS "Owner can update roles" ON public.channel_members`;
  await sql`
    CREATE POLICY "Owner can update roles" ON public.channel_members
      FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.channel_members cm2
        WHERE cm2.channel_id = channel_members.channel_id
          AND cm2.user_id = auth.uid()
          AND cm2.role = 'owner'
      ))
  `;
  console.log("   Done.\n");

  console.log("Phase 7 migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
