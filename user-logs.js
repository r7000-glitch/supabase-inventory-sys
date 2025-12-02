// user-logs.js
import { supabase } from './supabase.js';

/**
 * Logs a user action in the user_logs table
 * @param {Object} options
 * @param {'add'|'update'|'delete'} options.action - Action type
 * @param {string} options.tableName - Name of the table affected
 * @param {string} [options.recordId] - UUID of the affected record
 * @param {Object} [options.oldData] - Previous data (for updates/deletes)
 * @param {Object} [options.newData] - New data (for add/updates)
 */
export async function logUserAction({ action, tableName, recordId, oldData, newData }) {
  try {
    // Get the currently logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No logged-in user found:", userError);
      return;
    }

    // Fetch username/role from your users table (optional)
    const { data: appUser, error: userDataError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    const username = appUser?.username || user.email;

    // Insert the log record
    const { error } = await supabase.from('user_logs').insert([{
      user_id: user.id,
      username: username,
      action,
      table_name: tableName,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null
    }]);

    if (error) console.error("Failed to log user action:", error);

  } catch (err) {
    console.error("Error in logUserAction:", err);
  }
}

/**
 * Example helper functions
 */

// Log an update
export async function logUpdate(tableName, recordId, oldData, newData) {
  await logUserAction({ action: 'update', tableName, recordId, oldData, newData });
}

// Log a new record
export async function logAdd(tableName, recordId, newData) {
  await logUserAction({ action: 'add', tableName, recordId, newData });
}

// Log a delete
export async function logDelete(tableName, recordId, oldData) {
  await logUserAction({ action: 'delete', tableName, recordId, oldData });
}
