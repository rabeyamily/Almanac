import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

/** Legacy JWT anon key, or newer dashboard “Publishable” key (`sb_publishable_...`). */
function looksLikeClientApiKey(key: string): boolean {
  if (key.length < 20) return false;
  // Never put the secret key in the app — only servers should use `sb_secret_...`.
  if (key.startsWith('sb_secret_')) return false;
  if (key.startsWith('eyJ')) return true;
  if (key.startsWith('sb_publishable_')) return true;
  return false;
}

/** True when .env has a real Supabase project URL and a client-safe API key (not placeholders). */
function computeIsConfigured(url: string, key: string): boolean {
  if (!url || !key) return false;
  if (!looksLikeClientApiKey(key)) return false;
  const lowerUrl = url.toLowerCase();
  const lowerKey = key.toLowerCase();
  if (
    lowerUrl.includes('your-supabase') ||
    lowerUrl.includes('placeholder') ||
    lowerKey.includes('your-supabase') ||
    lowerKey.includes('placeholder')
  ) {
    return false;
  }
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    // Real Expo + Supabase projects use this host; avoids treating random https URLs as “configured”.
    return u.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = computeIsConfigured(rawUrl, rawKey);

if (rawKey.startsWith('sb_secret_')) {
  console.error(
    '[Supabase] You pasted the SECRET key in EXPO_PUBLIC_SUPABASE_ANON_KEY. Remove it from the app — use the Publishable key (sb_publishable_...) or legacy anon JWT only.'
  );
}

// createClient() throws if the URL string is not a valid HTTP(S) URL — placeholders break the app.
const resolvedUrl = isSupabaseConfigured
  ? rawUrl
  : 'https://example.com';

const resolvedKey = isSupabaseConfigured
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid-placeholder-key';

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are missing or still placeholders. ' +
      'Set them in .env to your real project values from supabase.com (Project Settings → API). ' +
      'The app will load, but auth and data will not work until then.'
  );
}

export const supabase: SupabaseClient = createClient(resolvedUrl, resolvedKey, {
  auth: {
    // Persist sessions via AsyncStorage so the user stays logged in
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web email verification links return auth params in the URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
