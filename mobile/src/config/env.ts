/**
 * Centralized Application Environment Configuration
 * Reads from EXPO_PUBLIC_* environment variables or falls back to configured defaults.
 */

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const FIREBASE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID ||
  '713022518840-rou6qgol3r8kpoqaojh2r35sq2g8bdfn.apps.googleusercontent.com';

export const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aesebdzwurpisuqfmksw.supabase.co';

export const SUPABASE_ANON_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_kivY5kK4AFm15bQdxW1hlQ_5DfcLXoS';

export default {
  API_URL,
  FIREBASE_WEB_CLIENT_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
