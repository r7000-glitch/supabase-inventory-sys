// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { config } from "./config.js";

// --- Supabase setup ---
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

// --- Fetch assets with server-side search, filter, sort, and pagination ---
export async function fetchAssets(search = "", statusFilter = "", dateSort = "", page = 1, pageSize = 50) {
  let query = supabase.from("assets").select("*", { count: 'exact' });

  // --- Status filter ---
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  // --- Search across multiple columns ---
  if (search) {
    const q = `%${search}%`;
    query = query.or(`
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
  }

  // --- Sorting ---
  if (dateSort === "newest") query = query.order("date", { ascending: false });
  if (dateSort === "oldest") query = query.order("date", { ascending: true });

  // --- Pagination ---
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    alert("Error fetching assets: " + error.message);
    return { data: [], total: 0 };
  }

  return { data, total: count }; // returns assets and total count for pagination
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
