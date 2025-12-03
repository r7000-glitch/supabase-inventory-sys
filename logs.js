import { supabaseClient } from "./supabase.js"; // Ensure supabaseClient is exported

/**
 * Add a log entry to the user_logs table
 * @param {object} currentUser - Current logged-in user object
 * @param {string} action - Action type (login, add_asset, edit_asset, delete_asset, etc.)
 * @param {string} details - Optional details about the action
 */
export async function addLog(currentUser, action, details = "") {
    if (!currentUser) {
        console.warn("No logged-in user. Log not saved.");
        return;
    }

    const { error } = await supabaseClient.from("user_logs").insert({
        user_id: currentUser.id || currentUser.username,
        action,
        details,
        created_at: new Date().toISOString()
    });

    if (error) console.error("Error saving log:", error);
    else console.log(`Log saved: ${action}`);
}
