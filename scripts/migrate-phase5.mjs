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
  console.log("Running Phase 5 migration...\n");

  // 2a. Attachment columns on messages
  console.log("2a. Adding attachment columns to messages...");
  await sql`ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text`;
  await sql`ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text`;
  await sql`ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type text`;
  console.log("   Done.\n");

  // 2b. Pinned messages table + RLS
  console.log("2b. Creating pinned_messages table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.pinned_messages (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
      message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
      pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE(channel_id, message_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_pinned_messages_channel ON public.pinned_messages(channel_id)`;
  await sql`ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY`;

  // RLS policies (drop first for idempotency)
  await sql`DROP POLICY IF EXISTS "Members can view pins" ON public.pinned_messages`;
  await sql`
    CREATE POLICY "Members can view pins" ON public.pinned_messages
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.channel_members WHERE channel_id = pinned_messages.channel_id AND user_id = auth.uid()
      ))
  `;

  await sql`DROP POLICY IF EXISTS "Members can pin messages" ON public.pinned_messages`;
  await sql`
    CREATE POLICY "Members can pin messages" ON public.pinned_messages
      FOR INSERT WITH CHECK (
        auth.uid() = pinned_by AND EXISTS (
          SELECT 1 FROM public.channel_members WHERE channel_id = pinned_messages.channel_id AND user_id = auth.uid()
        )
      )
  `;

  await sql`DROP POLICY IF EXISTS "Pinner or admin can unpin" ON public.pinned_messages`;
  await sql`
    CREATE POLICY "Pinner or admin can unpin" ON public.pinned_messages
      FOR DELETE USING (
        pinned_by = auth.uid() OR EXISTS (
          SELECT 1 FROM public.channel_members WHERE channel_id = pinned_messages.channel_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        )
      )
  `;
  console.log("   Done.\n");

  // 2c. Full-text search function + index
  console.log("2c. Creating full-text search index and function...");
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_fts ON public.messages USING gin(to_tsvector('english', content))`;

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION public.search_messages(
      search_query text, p_channel_id uuid DEFAULT NULL, max_results int DEFAULT 50
    )
    RETURNS TABLE (
      id uuid, channel_id uuid, user_id uuid, content text,
      parent_id uuid, created_at timestamptz, updated_at timestamptz,
      attachment_url text, attachment_name text, attachment_type text,
      channel_name text, display_name text, avatar_url text
    )
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
    BEGIN
      RETURN QUERY
      SELECT m.id, m.channel_id, m.user_id, m.content,
        m.parent_id, m.created_at, m.updated_at,
        m.attachment_url, m.attachment_name, m.attachment_type,
        c.name, p.display_name, p.avatar_url
      FROM public.messages m
      JOIN public.channels c ON c.id = m.channel_id
      JOIN public.profiles p ON p.id = m.user_id
      JOIN public.channel_members cm ON cm.channel_id = m.channel_id AND cm.user_id = auth.uid()
      WHERE to_tsvector('english', m.content) @@ plainto_tsquery('english', search_query)
        AND (p_channel_id IS NULL OR m.channel_id = p_channel_id)
      ORDER BY m.created_at DESC
      LIMIT max_results;
    END; $$
  `);
  console.log("   Done.\n");

  console.log("Phase 5 migration complete!");
  console.log("\nREMINDER: Create Supabase Storage buckets manually via Dashboard:");
  console.log('  1. "attachments" — public bucket, 50MB file size limit');
  console.log('  2. "avatars" — public bucket, 5MB file size limit');
  console.log("  3. Set storage RLS policies for each bucket.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
