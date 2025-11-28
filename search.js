import { supabase } from "./supabase.js";

/**
 * Live search assets from Supabase
 * @param {string} searchTerm - the search string
 * @param {string} statusFilter - optional status filter
 * @param {string} dateSort - "newest" or "oldest"
 * @param {number} page - page number for pagination (default 1)
 * @param {number} pageSize - items per page (default 50)
 * @returns {Promise<{data: Array, total: number}>}
 */
export async function searchAssets(searchTerm = "", statusFilter = "", dateSort = "", page = 1, pageSize = 50) {
  let query = supabase.from("assets").select("*", { count: "exact" });

  // Status filter
  if (statusFilter) query = query.eq("status", statusFilter);

  // Search across multiple columns
  if (searchTerm) {
    const q = `%${searchTerm}%`;
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

  // Sorting
  if (dateSort === "newest") query = query.order("date", { ascending: false });
  if (dateSort === "oldest") query = query.order("date", { ascending: true });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Search error:", error);
    return { data: [], total: 0 };
  }

  return { data, total: count };
}

import { searchAssets } from "./search.js";

// remove the bottom `export async function searchAssets(...)`

