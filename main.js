// --- main.js replacement ---
import { fetchAssets, addAsset, updateAsset, deleteSelected } from './supabase.js';
import { config } from './config.js';

// --- Users & roles ---
const users = config.users;

// --- Status mapping ---
const statusClassMap = {
  "In Use": "in-use",
  "Available": "available",
  "Defective": "defective",
  "Deployed Available": "deployed"
};

// --- State ---
let assets = [];
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// --- Elements ---
const loginModal = document.getElementById('loginModal');
const mainContent = document.getElementById('mainContent');
const loginBtn = document.getElementById('loginBtn');
const demoBtn = document.getElementById('demoBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addAssetBtn = document.getElementById('addAssetBtn');
const deleteBtn = document.getElementById('deleteBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const selectAllCheckbox = document.getElementById('selectAll');
const searchInput = document.getElementById('search');
const filterStatus = document.getElementById('filterStatus');
const filterDate = document.getElementById('filterDate');
const addModal = document.getElementById('addModal');
const closeAdd = document.getElementById('closeAdd');
const addSaveBtn = document.getElementById('addSaveBtn');
const roleIndicator = document.getElementById('roleIndicator');
const reportBtn = document.getElementById('reportBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// --- Loading ---
function showLoading(msg='Loading...'){ loadingText.textContent=msg; loadingOverlay.classList.add('show'); }
function hideLoading(){ loadingOverlay.classList.remove('show'); }

// --- Helpers ---
function formatDate(ts){ try{return new Date(ts).toLocaleString()}catch{return ts||''} }
function normalizeStatus(asset){ if(asset.status==='Deployed Available') return asset; if(asset.station&&asset.station.trim()!=='') asset.status='In Use'; if(!asset.status||asset.status.trim()==='') asset.status='Available'; return asset; }
function escapeHtml(str){ if(!str&&str!==0) return ''; return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

// --- Login ---
function applyRoleRestrictions(){
  if(!currentUser) return;
  roleIndicator.textContent=`Logged in as ${currentUser.username} (${currentUser.role})`;
  const isViewer = currentUser.role==='viewer';
  addAssetBtn.disabled=isViewer;
  deleteBtn.disabled=isViewer;
  importBtn.disabled=isViewer;
}

loginBtn.addEventListener('click', async()=>{
  const u=document.getElementById('username').value.trim();
  const p=document.getElementById('password').value.trim();
  const found = users.find(x=>x.username===u && x.password===p);
  if(!found) return alert('Invalid credentials');
  currentUser=found;
  sessionStorage.setItem('currentUser',JSON.stringify(currentUser));
  loginModal.classList.remove('show');
  mainContent.style.display='block';
  applyRoleRestrictions();
  await loadAssets();
});

demoBtn.addEventListener('click',()=>{ document.getElementById('username').value='admin'; document.getElementById('password').value='@dmin321'; });
logoutBtn.addEventListener('click',()=>{
  if(!confirm('Logout?')) return;
  currentUser=null;
  sessionStorage.removeItem('currentUser');
  roleIndicator.textContent='Not logged in';
  mainContent.style.display='none';
  loginModal.classList.add('show');
});

// --- Load assets ---
async function loadAssets(){
  showLoading('Fetching assets...');
  const search = searchInput.value||'';
  const statusFilterVal = filterStatus.value||'';
  const dateSortVal = filterDate.value||'';
  assets = await fetchAssets(search,statusFilterVal,dateSortVal)||[];
  renderTable();
  hideLoading();
}

// --- Render table ---
function updateCounters(){
  const rows=Array.from(document.querySelectorAll('#inventoryTable tbody tr')).filter(r=>r.style.display!=='none');
  let a=0,u=0,d=0,p=0;
  rows.forEach(r=>{ const st=r.querySelector('[data-col="status"] span')?.textContent?.trim()||''; if(st==='Available')a++; else if(st==='In Use')u++; else if(st==='Defective')d++; else if(st==='Deployed Available')p++; });
  document.getElementById('countAvailable').textContent='Available: '+a;
  document.getElementById('countInUse').textContent='In Use: '+u;
  document.getElementById('countDefective').textContent='Defective: '+d;
  document.getElementById('countDeployed').textContent='Deployed Available: '+p;
}

function renderTable(){
  const tbody=document.querySelector('#inventoryTable tbody'); tbody.innerHTML='';
  let list = assets.map(a=>({a:normalizeStatus({...a})}));

  const sf=filterStatus.value; if(sf) list=list.filter(i=>i.a.status===sf);
  const ds=filterDate.value; if(ds==='newest') list.sort((x,y)=>new Date(y.a.date||0)-new Date(x.a.date||0)); if(ds==='oldest') list.sort((x,y)=>new Date(x.a.date||0)-new Date(y.a.date||0));

  const q=(searchInput.value||'').toLowerCase();

  list.forEach(({a})=>{
    const rowText=`${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase();
    if(q && !rowText.includes(q)) return;
    const tr=document.createElement('tr'); tr.dataset.id=a.id;
    tr.innerHTML=`
      <td><input type='checkbox' data-id='${a.id}'></td>
      <td data-col='tag' class='editable'>${escapeHtml(a.tag||'')}</td>
      <td data-col='assetName' class='editable'>${escapeHtml(a.assetName||'')}</td>
      <td data-col='assetType' class='editable'>${escapeHtml(a.assetType||'')}</td>
      <td data-col='serial' class='editable'>${escapeHtml(a.serial||'')}</td>
      <td data-col='status' class='editable'><span class='status ${statusClassMap[a.status]||''}'>${escapeHtml(a.status||'')}</span></td>
      <td data-col='location' class='editable'>${escapeHtml(a.location||'')}</td>
      <td data-col='station' class='editable'>${escapeHtml(a.station||'')}</td>
      <td data-col='warranty' class='editable'>${escapeHtml(a.warranty||'')}</td>
      <td data-col='vendor' class='editable'>${escapeHtml(a.vendor||'')}</td>
      <td data-col='datePurchased' class='editable'>${escapeHtml(a.datePurchased||'')}</td>
      <td data-col='date' class='date-cell'>${escapeHtml(formatDate(a.date)||'')}</td>
      <td data-col='notes' class='editable'>${escapeHtml(a.notes||'')}</td>
    `;
    tbody.appendChild(tr);
  });
  applyEditableState();
  updateCounters();
}

// --- Inline editing ---
function applyEditableState(){
  const isViewer = currentUser && currentUser.role==='viewer';
  document.querySelectorAll('#inventoryTable tbody td.editable').forEach(td=>{
    if(isViewer){ td.removeAttribute('contenteditable'); td.classList.remove('editable-enabled'); }
    else{ td.setAttribute('contenteditable','true'); td.classList.add('editable-enabled'); }
  });
}
document.querySelector('#inventoryTable tbody').addEventListener('keydown',e=>{
  if(e.key==='Enter' && e.target && e.target.matches('td[contenteditable="true"]')){ e.preventDefault(); e.target.blur(); }
});
document.querySelector('#inventoryTable tbody').addEventListener('focusout',async(e)=>{
  const cell=e.target; if(!cell||!cell.matches('td')) return;
  const col=cell.dataset.col; const row=cell.closest('tr'); if(!row) return; const id=row.dataset.id; if(!id) return;
  if(!col||!['tag','assetName','assetType','serial','status','location','station','warranty','vendor','datePurchased','notes'].includes(col)) return;
  const newValue=cell.textContent.trim();
  if((col==='tag'||col==='serial')&&!newValue){ alert('Asset Tag and Serial cannot be empty.'); renderTable(); return; }
  await updateAsset(id,{[col]:newValue});
});

// --- Select all ---
selectAllCheckbox.addEventListener('change',()=>{ const checked=selectAllCheckbox.checked; document.querySelectorAll('#inventoryTable tbody input[type="checkbox"]').forEach(cb=>cb.checked=checked); });

// --- Delete ---
deleteBtn.addEventListener('click',async()=>{
  if(!currentUser) return alert('Please login first.');
  if(currentUser.role==='viewer') return alert('Viewer cannot delete.');
  const boxes=Array.from(document.querySelectorAll('#inventoryTable tbody input[type="checkbox"]:checked'));
  if(!boxes.length) return alert('Select at least one row.');
  if(!confirm('Delete selected asset(s)?')) return;
  const ids=boxes.map(cb=>cb.dataset.id).filter(Boolean);
  await deleteSelected(ids);
  await loadAssets();
});

// --- Search/filter live ---
searchInput.addEventListener('input',()=>loadAssets());
filterStatus.addEventListener('change',()=>loadAssets());
filterDate.addEventListener('change',()=>loadAssets());

// --- Initialize login ---
function ensureLogin(){
  if(!currentUser){ loginModal.classList.add('show'); mainContent.style.display='none'; }
  else{ loginModal.classList.remove('show'); mainContent.style.display='block'; }
}
document.getElementById('username').addEventListener('keyup',e=>{if(e.key==='Enter')loginBtn.click();});
document.getElementById('password').addEventListener('keyup',e=>{if(e.key==='Enter')loginBtn.click();});
ensureLogin();
if(currentUser){ roleIndicator.textContent=`Logged in as ${currentUser.username} (${currentUser.role})`; loadAssets(); }
