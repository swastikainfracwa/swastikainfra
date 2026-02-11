import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('your-project-url-here')) {
    throw new Error(
      '❌ Missing NEXT_PUBLIC_SUPABASE_URL\n\n' +
      'Please add your Supabase project URL to .env.local:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\n\n' +
      'Get it from: https://app.supabase.com/project/_/settings/api'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key-here')) {
    throw new Error(
      '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
      'Please add your Supabase anon key to .env.local:\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key\n\n' +
      'Get it from: https://app.supabase.com/project/_/settings/api'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
