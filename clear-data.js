// Run this script to delete all data from Supabase assets table
// Usage: open clear-data.html in browser (via local server)

import { supabase } from "./supabase.js";

async function clearAllData() {
  console.log("Deleting all assets from Supabase...");
  
  const { error } = await supabase.from("assets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  if (error) {
    console.error("Error deleting data:", error.message);
    alert("Error: " + error.message);
  } else {
    console.log("All data deleted successfully!");
    alert("All data deleted successfully! You can now start fresh.");
  }
}

clearAllData();

