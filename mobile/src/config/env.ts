/**
 * Centralized Application Environment Configuration
 * Reads from EXPO_PUBLIC_* environment variables or falls back to safe defaults.
 */

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const FIREBASE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID || '';

export const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

export const SUPABASE_ANON_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export default {
  API_URL,
  FIREBASE_WEB_CLIENT_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};
