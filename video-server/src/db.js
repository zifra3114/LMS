import { createClient } from '@supabase/supabase-js';

/**
 * Supabase se baat karne wali saari cheezein yahan hain. Baqi server sirf in functions
 * ko jaanta hai, isliye table ka naam badalna ho to sirf yahi file badlein.
 */
export function createDb({ supabaseUrl, supabaseServiceKey }) {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    /** Angular se aaye Supabase access token se user pehchanta hai. */
    async getUserFromToken(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return null;

      return { id: data.user.id, email: data.user.email ?? null };
    },

    /** Admin wohi hai jiske `profiles.role` mein 'admin' likha ho (Angular ke AuthService.isAdmin jaisa). */
    async isAdminUser(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.role === 'admin';
    },

    async getLecture(id) {
      const { data, error } = await client
        .from('lectures')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async updateLecture(id, patch) {
      const { error } = await client.from('lectures').update(patch).eq('id', id);
      if (error) throw error;
    },

    /** Student us batch ka hai ya nahi: students.user_id = login ki id, students.batch_id = uska batch. */
    async isBatchMember(userId, batchId) {
      const { data, error } = await client
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .eq('batch_id', batchId)
        .limit(1);

      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },

    async listProcessingIds() {
      const { data, error } = await client
        .from('lectures')
        .select('id')
        .eq('processing_status', 'Processing');

      if (error) throw error;
      return (data ?? []).map((row) => row.id);
    },
  };
}