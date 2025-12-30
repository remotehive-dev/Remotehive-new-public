
import { getSupabase } from "./supabase";

export async function getSavedJobsCount(userId: string, token?: string) {
  const supabase = getSupabase(token);
  const { count, error } = await supabase
    .from('saved_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.warn('Error fetching saved jobs count:', error);
    return 0;
  }
  return count || 0;
}

export async function getApplicationsCount(userId: string, token?: string) {
  const supabase = getSupabase(token);
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', userId);

  if (error) {
    console.warn('Error fetching applications count:', error);
    return 0;
  }
  return count || 0;
}
