// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js";

// --- Supabase setup ---
const SUPABASE_URL = "https://iwwopytnacebtffzcnmq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3d29weXRuYWNlYnRmZnpjbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTY5OTUsImV4cCI6MjA3OTgzMjk5NX0.kPBBZaw-vfxBkYfYPJOIQFUU3q2vuaIAmfXlAEI-NEM"; // replace with your anon key
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let assets = [];

// --- Helper: render table ---
function renderTable(filteredAssets) {
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";

  const statusClassMap = {
    "In Use": "in-use",
    "Available": "available",
    "Defective": "defective",
    "Deployed Available": "deployed"
  };

  filteredAssets.forEach(a => {
    const tr = document.createElement("tr");
    tr.dataset.id = a.id;
    tr.innerHTML = `
      <td><input type="checkbox" data-id="${a.id}"></td>
      <td data-col="tag" class="editable">${a.tag || ""}</td>
      <td data-col="assetName" class="editable">${a.assetName || ""}</td>
      <td data-col="assetType" class="editable">${a.assetType || ""}</td>
      <td data-col="serial" class="editable">${a.serial || ""}</td>
      <td data-col="status" class="editable"><span class="status ${statusClassMap[a.status] || ''}">${a.status || ""}</span></td>
      <td data-col="location" class="editable">${a.location || ""}</td>
      <td data-col="station" class="editable">${a.station || ""}</td>
      <td data-col="warranty" class="editable">${a.warranty || ""}</td>
      <td data-col="vendor" class="editable">${a.vendor || ""}</td>
      <td data-col="datePurchased" class="editable">${a.datePurchased || ""}</td>
      <td data-col="date" class="date-cell">${new Date(a.date).toLocaleString()}</td>
      <td data-col="notes" class="editable">${a.notes || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Fetch assets ---
export async function fetchAssets(search = "", statusFilter = "", dateSort = "") {
  const { data, error } = await supabase.from("assets").select("*");
  if (error) return alert("Error fetching assets: " + error.message);
  assets = data.map(a => ({ ...a }));

  let filtered = [...assets];
  if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);
  if (dateSort === "newest") filtered.sort((a,b)=> new Date(b.date) - new Date(a.date));
  if (dateSort === "oldest") filtered.sort((a,b)=> new Date(a.date) - new Date(b.date));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a => 
      `${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase().includes(q)
    );
  }

  renderTable(filtered);
  return filtered;
}

// --- Add asset ---
export async function addAsset(asset) {
  const { error } = await supabase.from("assets").insert([asset]);
  if (error) return alert("Error adding asset: " + error.message);
  await fetchAssets();
}

// --- Update asset ---
export async function updateAsset(id, updatedFields) {
  const { error } = await supabase.from("assets").update(updatedFields).eq("id", id);
  if (error) return alert("Error updating asset: " + error.message);
  await fetchAssets();
}

// --- Delete selected ---
export async function deleteSelected(ids) {
  const { error } = await supabase.from("assets").delete().in("id", ids);
  if (error) return alert("Error deleting assets: " + error.message);
  await fetchAssets();
}
