import { supabaseClient } from "./supabase.js";

export async function addLog(currentUser, action, details = "") {
    if (!currentUser) {
        console.warn("No logged-in user. Log not saved.");
        return;
    }

    const { error } = await supabaseClient.from("logs").insert({
        user_id: currentUser.id || currentUser.username,
        action,
        details,
        created_at: new Date().toISOString()
    });

    if (error) console.error("Error saving log:", error);
    else console.log(`Log saved: ${action}`);
}
