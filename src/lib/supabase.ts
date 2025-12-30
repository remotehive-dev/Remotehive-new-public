import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let authenticatedClient: { token: string, client: SupabaseClient } | null = null;

export function getSupabase(accessToken?: string) {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (accessToken) {
    // Return cached client if token hasn't changed to avoid "Multiple GoTrueClient instances" warning
    if (authenticatedClient?.token === accessToken) {
      return authenticatedClient.client;
    }

    const newClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    
    authenticatedClient = { token: accessToken, client: newClient };
    return newClient;
  }

  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

