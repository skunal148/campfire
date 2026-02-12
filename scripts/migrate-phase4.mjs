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
  console.log("Running Phase 4 migration...\n");

  // 1a. Add is_dm column to channels
  console.log("1a. Adding is_dm column to channels...");
  await sql`ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_dm boolean NOT NULL DEFAULT false`;
  console.log("   Done.\n");

  // 1b. Create channel_reads table
  console.log("1b. Creating channel_reads table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.channel_reads (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
      last_read_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE(user_id, channel_id)
    )
  `;
  // Index (IF NOT EXISTS for safety)
  await sql`CREATE INDEX IF NOT EXISTS idx_channel_reads_user ON public.channel_reads(user_id)`;
  // Enable RLS
  await sql`ALTER TABLE public.channel_reads ENABLE ROW LEVEL SECURITY`;
  // RLS policies (drop first to be idempotent)
  await sql`DROP POLICY IF EXISTS "Users can view own reads" ON public.channel_reads`;
  await sql`CREATE POLICY "Users can view own reads" ON public.channel_reads FOR SELECT USING (auth.uid() = user_id)`;
  await sql`DROP POLICY IF EXISTS "Users can upsert own reads" ON public.channel_reads`;
  await sql`CREATE POLICY "Users can upsert own reads" ON public.channel_reads FOR INSERT WITH CHECK (auth.uid() = user_id)`;
  await sql`DROP POLICY IF EXISTS "Users can update own reads" ON public.channel_reads`;
  await sql`CREATE POLICY "Users can update own reads" ON public.channel_reads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`;
  console.log("   Done.\n");

  // 1c. get_or_create_dm function
  console.log("1c. Creating get_or_create_dm function...");
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.get_or_create_dm(other_user_id uuid)
    RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
    DECLARE
      current_user_id uuid := auth.uid();
      dm_name text;
      dm_channel_id uuid;
    BEGIN
      IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
      IF current_user_id = other_user_id THEN RAISE EXCEPTION 'Cannot DM yourself'; END IF;

      IF current_user_id < other_user_id THEN
        dm_name := 'dm:' || current_user_id || ':' || other_user_id;
      ELSE
        dm_name := 'dm:' || other_user_id || ':' || current_user_id;
      END IF;

      SELECT id INTO dm_channel_id FROM public.channels WHERE name = dm_name AND is_dm = true;
      IF dm_channel_id IS NOT NULL THEN RETURN dm_channel_id; END IF;

      INSERT INTO public.channels (name, is_private, is_dm, created_by)
      VALUES (dm_name, true, true, current_user_id)
      RETURNING id INTO dm_channel_id;

      INSERT INTO public.channel_members (channel_id, user_id, role) VALUES
        (dm_channel_id, current_user_id, 'member'),
        (dm_channel_id, other_user_id, 'member');

      RETURN dm_channel_id;
    END; $$
  `);
  console.log("   Done.\n");

  // 1d. get_conversations function
  console.log("1d. Creating get_conversations function...");
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.get_conversations()
    RETURNS TABLE (
      channel_id uuid, other_user_id uuid, display_name text,
      avatar_url text, status text, last_message_at timestamptz
    ) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
    BEGIN
      RETURN QUERY
      SELECT c.id, p.id, p.display_name, p.avatar_url, p.status,
        COALESCE((SELECT MAX(m.created_at) FROM public.messages m WHERE m.channel_id = c.id), c.created_at)
      FROM public.channels c
      JOIN public.channel_members cm_me ON cm_me.channel_id = c.id AND cm_me.user_id = auth.uid()
      JOIN public.channel_members cm_other ON cm_other.channel_id = c.id AND cm_other.user_id != auth.uid()
      JOIN public.profiles p ON p.id = cm_other.user_id
      WHERE c.is_dm = true
      ORDER BY last_message_at DESC;
    END; $$
  `);
  console.log("   Done.\n");

  // 1e. get_unread_counts function
  console.log("1e. Creating get_unread_counts function...");
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.get_unread_counts()
    RETURNS TABLE (channel_id uuid, unread_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
    BEGIN
      RETURN QUERY
      SELECT cm.channel_id, COUNT(m.id)
      FROM public.channel_members cm
      LEFT JOIN public.channel_reads cr ON cr.channel_id = cm.channel_id AND cr.user_id = cm.user_id
      LEFT JOIN public.messages m ON m.channel_id = cm.channel_id
        AND m.created_at > COALESCE(cr.last_read_at, '1970-01-01'::timestamptz)
        AND m.parent_id IS NULL
      WHERE cm.user_id = auth.uid()
      GROUP BY cm.channel_id HAVING COUNT(m.id) > 0;
    END; $$
  `);
  console.log("   Done.\n");

  console.log("Phase 4 migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
