
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Create a mock Supabase client for when credentials aren't provided
const createMockClient = () => {
  const mockAuthMethods = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signInWithOtp: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
  };

  return {
    auth: mockAuthMethods,
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null, status: 200 }) }) }),
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
      delete: async () => ({ error: null }),
    }),
  } as unknown as SupabaseClient;
};

// Only create real client if credentials are provided
export const supabase: SupabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createMockClient();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
