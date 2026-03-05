// Supabase client configuration
//
// TO CONFIGURE SUPABASE:
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings > API
// 3. Copy your Project URL and anon/public key
// 4. Replace the placeholder values below
//
// SUPABASE SQL SCHEMA (run this in Supabase SQL Editor):
//
// -- Messages table
// CREATE TABLE messages (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   message_id TEXT UNIQUE NOT NULL,
//   order_id TEXT NOT NULL,
//   sender_pseudonym TEXT NOT NULL,
//   content TEXT NOT NULL,
//   timestamp BIGINT NOT NULL,
//   is_flagged BOOLEAN DEFAULT false,
//   read_at BIGINT,
//   deleted_at BIGINT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Files table
// CREATE TABLE files (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   file_id TEXT UNIQUE NOT NULL,
//   order_id TEXT NOT NULL,
//   uploader_pseudonym TEXT NOT NULL,
//   file_name TEXT NOT NULL,
//   file_size BIGINT NOT NULL,
//   storage_url TEXT,
//   created_at BIGINT NOT NULL,
//   expires_at BIGINT NOT NULL
// );
//
// -- Disputes table
// CREATE TABLE disputes (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   order_id TEXT UNIQUE NOT NULL,
//   lister_pseudonym TEXT NOT NULL,
//   reason TEXT NOT NULL,
//   status TEXT DEFAULT 'open', -- 'open', 'resolved_writer', 'resolved_lister'
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Enable Row Level Security (RLS) - IMPORTANT
// ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
// ALTER TABLE files ENABLE ROW LEVEL SECURITY;
// ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
//
// -- Allow read/write with anon key (for MVP - tighten in production)
// CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON files FOR ALL USING (true) WITH CHECK (true);
// CREATE POLICY "Allow all" ON disputes FOR ALL USING (true) WITH CHECK (true);
//
// SUPABASE STORAGE:
// 1. Go to Storage in Supabase dashboard
// 2. Create a new bucket called "order-files"
// 3. Set it to Private
// 4. Add policy: Allow authenticated users to upload

import { createClient } from "@supabase/supabase-js";

// PLACEHOLDER: Replace with your Supabase project URL
// Format: https://xxxxxxxxxxx.supabase.co
const SUPABASE_URL = "https://placeholder.supabase.co";

// PLACEHOLDER: Replace with your Supabase anon/public key
// Find it in: Supabase Dashboard > Project Settings > API > Project API keys
const SUPABASE_ANON_KEY = "placeholder-supabase-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured =
  SUPABASE_URL !== "https://placeholder.supabase.co" &&
  SUPABASE_ANON_KEY !== "placeholder-supabase-anon-key";
