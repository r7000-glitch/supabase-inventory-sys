import { fetchAssets, addAsset, updateAsset, deleteSelected } from "./supabase.js";
import { signUp, login, logout, getCurrentUser } from "./auth.js"; // <-- auth.js
import { config } from "./config.js"; // keep this for other configs if needed

// --- Status CSS mapping ---
const statusClassMap = {
  "In Use": "in-use",
  "Available": "available",
  "Defective": "defective",
  "Deployed Available": "deployed"
};

// --- State ---
let assets = [];
let currentUser = null;

// --- Elements ---
const loginModal = document.getElementById("loginModal");
const mainContent = document.getElementById("mainContent");
const loginBtn = document.getElementById("loginBtn");
const demoBtn = document.getElementById("demoBtn");
const logoutBtn = document.getElementById("logoutBtn");
const addAssetBtn = document.getElementById("addAssetBtn");
const deleteBtn = document.getElementById("deleteBtn");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const selectAllCheckbox = document.getElementById("selectAll");
const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");
const addModal = document.getElementById("addModal");
const closeAdd = document.getElementById("closeAdd");
const addSaveBtn = document.getElementById("addSaveBtn");
const roleIndicator = document.getElementById("roleIndicator");
const reportBtn = document.getElementById("reportBtn");

// --- Loading overlay ---
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
function showLoading(message = "Loading...") { loadingText.textContent = message; loadingOverlay.classList.add("show"); }
function hideLoading() { loadingOverlay.classList.remove("show"); }

// --- Helpers ---
function formatDate(ts) { try { return new Date(ts).toLocaleString(); } catch { return ts || ""; } }
function escapeHtml(str) { if (!str && str !== 0) return ""; return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function normalizeStatus(asset) {
  if (asset.status === "Deployed Available") return asset.status;
  if (asset.station && asset.station.trim() !== "") asset.status = "In Use";
  if (!asset.status || asset.status.trim() === "") asset.status = "Available";
  return asset;
}

// --- Role restrictions ---
function applyRoleRestrictions() {
  if (!currentUser) return;
  roleIndicator.textContent = `Logged in as ${currentUser.email} (${currentUser.role || 'user'})`;
  const isViewer = currentUser.role === "viewer";
  addAssetBtn.disabled = isViewer;
  deleteBtn.disabled = isViewer;
  importBtn.disabled = isViewer;
}

// --- Login handling ---
async function ensureLogin() {
  currentUser = await getCurrentUser();
  if (!currentUser) { 
    loginModal.classList.add("show"); 
    mainContent.style.display = "none"; 
  } else { 
    loginModal.classList.remove("show"); 
    mainContent.style.display = "block"; 
    applyRoleRestrictions(); 
    await loadAssets();
  }
}

// --- Login button ---
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  try {
    await login(email, password);
    currentUser = await getCurrentUser();

    loginModal.classList.remove("show");
    mainContent.style.display = "block";
    applyRoleRestrictions();
    await loadAssets();
  } catch (err) {
    alert("Invalid credentials or login error");
    console.error(err);
  }
});

// --- Demo button (optional) ---
demoBtn.addEventListener("click", () => {
  document.getElementById("username").value = "demo@example.com";
  document.getElementById("password").value = "password123";
});

// --- Logout button ---
logoutBtn.addEventListener("click", async () => {
  if (!confirm("Logout?")) return;
  await logout();
  currentUser = null;
  roleIndicator.textContent = "Not logged in";
  mainContent.style.display = "none";
  loginModal.classList.add("show");
});

// --- Enter key triggers login ---
document.getElementById("username").addEventListener("keyup", e => { if(e.key==="Enter") loginBtn.click(); });
document.getElementById("password").addEventListener("keyup", e => { if(e.key==="Enter") loginBtn.click(); });

// --- Load assets ---
async function loadAssets() {
  const search = searchInput.value || "";
  const statusFilter = filterStatus.value || "";
  const dateSort = filterDate.value || "";
  assets = await fetchAssets(search, statusFilter, dateSort) || [];
  renderTable();
}

// --- Render table ---
function updateCounters() {
  const rows = Array.from(document.querySelectorAll("#inventoryTable tbody tr")).filter(r => r.style.display !== "none");
  let a=0,u=0,d=0,p=0;
  rows.forEach(row => {
    const st = row.querySelector("[data-col='status'] span")?.textContent?.trim() || "";
    if(st==="Available") a++; else if(st==="In Use") u++; else if(st==="Defective") d++; else if(st==="Deployed Available") p++;
  });
  document.getElementById("countAvailable").textContent = "Available: "+a;
  document.getElementById("countInUse").textContent = "In Use: "+u;
  document.getElementById("countDefective").textContent = "Defective: "+d;
  document.getElementById("countDeployed").textContent = "Deployed Available: "+p;
}

function renderTable() {
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";
  let list = assets.map((a,idx)=>({a:normalizeStatus({...a}),idx}));
  const sf = filterStatus.value; if(sf) list = list.filter(item=>item.a.status===sf);
  const ds = filterDate.value; if(ds==="newest") list.sort((x,y)=>new Date(y.a.date||0)-new Date(x.a.date||0)); if(ds==="oldest") list.sort((x,y)=>new Date(x.a.date||0)-new Date(y.a.date||0));
  const q = (searchInput.value||"").toLowerCase();

  list.forEach(({a,idx})=>{
    const rowText = `${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase();
    if(q && !rowText.includes(q)) return;
    const tr=document.createElement("tr");
    tr.dataset.index=idx;
    tr.dataset.id=a.id;
    tr.innerHTML=`
      <td><input type="checkbox" data-index="${idx}" data-id="${a.id}"></td>
      <td data-col="tag" class="editable">${escapeHtml(a.tag||"")}</td>
      <td data-col="assetName" class="editable">${escapeHtml(a.assetName||"")}</td>
      <td data-col="assetType" class="editable">${escapeHtml(a.assetType||"")}</td>
      <td data-col="serial" class="editable">${escapeHtml(a.serial||"")}</td>
      <td data-col="status" class="editable"><span class="status ${statusClassMap[a.status]||''}">${escapeHtml(a.status||"")}</span></td>
      <td data-col="location" class="editable">${escapeHtml(a.location||"")}</td>
      <td data-col="station" class="editable">${escapeHtml(a.station||"")}</td>
      <td data-col="warranty" class="editable">${escapeHtml(a.warranty||"")}</td>
      <td data-col="vendor" class="editable">${escapeHtml(a.vendor||"")}</td>
      <td data-col="datePurchased" class="editable">${escapeHtml(a.datePurchased||"")}</td>
      <td data-col="date" class="date-cell">${escapeHtml(formatDate(a.date)||"")}</td>
      <td data-col="notes" class="editable">${escapeHtml(a.notes||"")}</td>
    `;
    tbody.appendChild(tr);
  });
  applyEditableState();
  updateCounters();
}

// --- Inline Editing ---
function applyEditableState() {
  const isViewer = currentUser && currentUser.role === "viewer";
  document.querySelectorAll("#inventoryTable tbody td.editable").forEach(td=>{
    if(isViewer){ td.removeAttribute("contenteditable"); td.classList.remove("editable-enabled"); }
    else { td.setAttribute("contenteditable","true"); td.classList.add("editable-enabled"); }
  });
}
document.querySelector("#inventoryTable tbody").addEventListener("keydown",(e)=>{if(e.key==="Enter"&&e.target&&e.target.matches("td[contenteditable='true']")){e.preventDefault();e.target.blur();}});
document.querySelector("#inventoryTable tbody").addEventListener("focusout", async (e)=>{
  const cell=e.target;
  if(!cell||!cell.matches("td")) return;
  const col=cell.dataset.col;
  const row=cell.closest("tr");
  if(!row) return;
  const id=row.dataset.id;
  if(!id) return;
  if(!col||!["tag","assetName","assetType","serial","status","location","station","warranty","vendor","datePurchased","notes"].includes(col)) return;
  const newValue=cell.textContent.trim();
  if((col==="tag"||col==="serial")&&!newValue){alert("Asset Tag and Serial cannot be empty."); renderTable(); return;}
  await updateAsset(id,{[col]:newValue});
});

// --- Rest of your main.js (Select all, Delete, Import/Export, Add Asset, Report, Filters, etc.) ---
// Keep all existing code below this point as is, since inventory functions don't change

// --- Initialize ---
ensureLogin();

// --- Real-time refresh every 60 seconds ---
setInterval(async ()=>{ if(currentUser) await loadAssets(); },60000);
