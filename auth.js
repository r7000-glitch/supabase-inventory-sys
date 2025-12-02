// auth.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js";

// Your Supabase credentials
const SUPABASE_URL = "https://iwwopytnacebtffzcnmq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d29weXRuYWNlYnRmZnpjbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTY5OTUsImV4cCI6MjA3OTgzMjk5NX0.kPBBZaw-vfxBkYfYPJOIQFUU3q2vuaIAmfXlAEI-NEM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Sign Up ---
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return console.error("Sign Up Error:", error.message);
    
    // Add to users table
    await supabase.from("users").insert({
        user_id: data.user.id,
        email: data.user.email,
        role: "user"
    });
    console.log("User created in users table!");
}

// --- Login ---
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return console.error("Login Error:", error.message);
    console.log("Login Successful:", data.user);
}

// --- Logout ---
export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return console.error("Logout Error:", error.message);
    console.log("Logged out successfully");
}

// --- Get current user ---
export async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}
