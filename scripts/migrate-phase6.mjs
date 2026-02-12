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
  console.log("Running Phase 6 migration...\n");

  console.log("Creating huddle_sessions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.huddle_sessions (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
      started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      started_at timestamptz DEFAULT now() NOT NULL,
      ended_at timestamptz,
      livekit_room_name text NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_huddle_sessions_channel ON public.huddle_sessions(channel_id)`;
  await sql`ALTER TABLE public.huddle_sessions ENABLE ROW LEVEL SECURITY`;

  await sql`DROP POLICY IF EXISTS "Members can view huddle sessions" ON public.huddle_sessions`;
  await sql`
    CREATE POLICY "Members can view huddle sessions" ON public.huddle_sessions
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = huddle_sessions.channel_id AND cm.user_id = auth.uid()
      ))
  `;
  console.log("   Done.\n");

  console.log("Phase 6 migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
