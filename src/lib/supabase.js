import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekxaazhbebwuuxirtcv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3hhYXpoYmVid3V1eGlydGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODk4MTYsImV4cCI6MjA3OTI2NTgxNn0.L3cdFTv4O1T5OPFEWJEUJdCZZx1Wv3j5RnF_D2lg-FU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'a4db2e3c-fea6-41e6-a8a3-5413c99a896c';
export const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID || 'd9d98c1a-39bf-4956-bf48-c4cea9e1f954';
