import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Platform-aware storage adapter
const createStorageAdapter = () => {
  // Use localStorage for web, SecureStore for native
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  } else {
    // Native platforms use SecureStore
    return {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };
  }
};

const storageAdapter = createStorageAdapter();

// You'll need to replace these with your actual Supabase credentials
// For development/production, these should be provided via env vars (Expo or Next-style)
const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;
const rawAnon =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Debug logging
console.log('=== SUPABASE ENV DEBUG ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_URL));
console.log('NEXT_PUBLIC_SUPABASE_URL:', JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL));
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY));
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
console.log('rawUrl:', JSON.stringify(rawUrl));
console.log('rawAnon:', JSON.stringify(rawAnon));
console.log('========================');


// Normalize values (trim whitespace and surrounding quotes)
function normalizeEnv(val?: string | number | boolean | null) {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim().replace(/^['\"]|['\"]$/g, '');
  return trimmed.length ? trimmed : undefined;
}

let supabaseUrl = normalizeEnv(rawUrl);
let supabaseAnonKey = normalizeEnv(rawAnon);

// If URL is missing protocol but otherwise looks like a host, prepend https://
if (supabaseUrl && !/^https?:\/\//.test(supabaseUrl)) {
  supabaseUrl = `https://${supabaseUrl}`;
}

if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) {
  console.warn('Invalid SUPABASE URL: provide a valid http(s) URL via EXPO_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_URL.');
  // Fallback to prevent crash, but requests will fail
  supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabaseAnonKey) {
  console.warn('Missing SUPABASE anon key: set EXPO_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_ANON_KEY.');
  // Fallback to prevent crash
  supabaseAnonKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey!, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
