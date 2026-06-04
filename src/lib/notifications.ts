import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS when creating system notifications
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error', message: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type: type,
          message: message
        }
      ]);

    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception creating notification:', err);
    return false;
  }
}
