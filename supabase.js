// supabase.js
const SUPABASE_URL = "https://iwwopytnacebtffzcnmq.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // replace with your anon key
const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_KEY);

// Fetch all assets
async function fetchAssets() {
  const { data, error } = await supabase.from("assets").select("*");
  if (error) return alert("Error fetching assets: " + error.message);
  renderTable(data);
}

// Add asset
async function addAsset(asset) {
  const { error } = await supabase.from("assets").insert([asset]);
  if (error) return alert("Error adding asset: " + error.message);
  fetchAssets();
}

// Update asset
async function updateAsset(id, updatedFields) {
  const { error } = await supabase.from("assets").update(updatedFields).eq("id", id);
  if (error) return alert("Error updating asset: " + error.message);
  fetchAssets();
}

// Delete selected assets
async function deleteSelected(ids) {
  const { error } = await supabase.from("assets").delete().in("id", ids);
  if (error) return alert("Error deleting assets: " + error.message);
  fetchAssets();
}
