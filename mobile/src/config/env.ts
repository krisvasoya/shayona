import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the computer's backend API URL:
 * - If running on a real phone via Expo Go, resolves the host IP automatically.
 * - If Android emulator, connects via 10.0.2.2 or direct Wi-Fi IP (10.120.194.9).
 */
const getDynamicApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.120.194.9:5000/api/v1';
  }

  return 'http://localhost:5000/api/v1';
};

export const API_URL: string = getDynamicApiUrl();

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
