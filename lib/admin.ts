import { supabaseServer } from './supabase-server';

/**
 * Check if a user is an admin/streamer
 */
export async function isAdmin(twitchUserId: string): Promise<boolean> {
  if (!twitchUserId || !supabaseServer) {
    return false;
  }

  try {
    const { data, error } = await supabaseServer
      .from('admins')
      .select('id')
      .eq('twitch_user_id', twitchUserId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking admin status:', error);
    }
    return false;
  }
}

/**
 * Get all admins
 */
export async function getAllAdmins() {
  if (!supabaseServer) {
    return [];
  }

  try {
    const { data, error } = await supabaseServer
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching admins:', error);
      }
      return [];
    }

    return data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getAllAdmins:', error);
    }
    return [];
  }
}

/**
 * Add a new admin
 */
export async function addAdmin(
  twitchUserId: string,
  twitchUsername: string,
  addedBy: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  if (!supabaseServer) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Check if already an admin
    const { data: existing } = await supabaseServer
      .from('admins')
      .select('id')
      .eq('twitch_user_id', twitchUserId)
      .single();

    if (existing) {
      return { success: false, error: 'User is already an admin' };
    }

    // Add new admin
    const { data, error } = await supabaseServer
      .from('admins')
      .insert({
        twitch_user_id: twitchUserId,
        twitch_username: twitchUsername,
        added_by: addedBy,
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding admin:', error);
      }
      return { success: false, error: 'Could not add admin' };
    }

    return { success: true, data };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in addAdmin:', error);
    }
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Remove an admin
 */
export async function removeAdmin(
  twitchUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseServer) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Count total admins
    const { count } = await supabaseServer
      .from('admins')
      .select('*', { count: 'exact', head: true });

    // Prevent removing the last admin
    if (count && count <= 1) {
      return { success: false, error: 'Cannot remove the last admin' };
    }

    const { error } = await supabaseServer
      .from('admins')
      .delete()
      .eq('twitch_user_id', twitchUserId);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing admin:', error);
      }
      return { success: false, error: 'Could not remove admin' };
    }

    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in removeAdmin:', error);
    }
    return { success: false, error: 'Internal error' };
  }
}

