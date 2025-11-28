roleIndicator.textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
loadAssets();
}

import { supabase } from "./supabase.js";

export async function searchAssets(searchTerm) {
  if (!searchTerm) return [];
  const q = `%${searchTerm}%`;
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .or(`
      tag.ilike.${q},
      assetName.ilike.${q},
      assetType.ilike.${q},
      serial.ilike.${q},
      status.ilike.${q},
      location.ilike.${q},
      station.ilike.${q},
      warranty.ilike.${q},
      vendor.ilike.${q},
      datePurchased.ilike.${q},
      date.ilike.${q},
      notes.ilike.${q}
    `);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data;
}

// --- Auto-refresh assets every 60 seconds ---
const AUTO_REFRESH_INTERVAL = 60000; // 60,000 ms = 60 seconds

setInterval(async () => {
  if (currentUser) {
    console.log("Auto-refreshing assets...");
    await loadAssets();
  }
