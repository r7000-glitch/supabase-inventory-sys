// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { config } from "./config.js";

// --- Supabase setup ---
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

// --- Fetch assets ---
export async function fetchAssets(search = "", statusFilter = "", dateSort = "") {
  const { data, error } = await supabase.from("assets").select("*");
  if (error) {
    alert("Error fetching assets: " + error.message);
    return [];
  }

  let filtered = data.map(a => ({ ...a }));

  if (statusFilter) {
    filtered = filtered.filter(a => a.status === statusFilter);
  }
  if (dateSort === "newest") {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  if (dateSort === "oldest") {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      `${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase().includes(q)
    );
  }

  return filtered;
}

// --- Add asset ---
export async function addAsset(asset) {
  const { error } = await supabase.from("assets").insert([asset]);
  if (error) {
    alert("Error adding asset: " + error.message);
    return false;
  }
  return true;
}

// --- Update asset ---
export async function updateAsset(id, updatedFields) {
  const { error } = await supabase.from("assets").update(updatedFields).eq("id", id);
  if (error) {
    alert("Error updating asset: " + error.message);
    return false;
  }
  return true;
}

// --- Delete selected ---
export async function deleteSelected(ids) {
  const { error } = await supabase.from("assets").delete().in("id", ids);
  if (error) {
    alert("Error deleting assets: " + error.message);
    return false;
  }
  return true;
}
