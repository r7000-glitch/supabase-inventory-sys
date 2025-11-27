document.addEventListener("DOMContentLoaded", () => {
  // --- Users & roles ---
  const users = [
    { username: "admin", password: "@dmin321", role: "admin" },
    { username: "user", password: "user", role: "user" },
    { username: "viewer", password: "viewer", role: "viewer" }
  ];

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

  // --- Status to CSS mapping ---
  const statusClassMap = {
    "In Use": "in-use",
    "Available": "available",
    "Defective": "defective",
    "Deployed Available": "deployed"
  };

  // --- Data ---
  let assets = JSON.parse(localStorage.getItem("assets") || "[]");
  let currentUser = null;

  // --- Helpers ---
  function saveAssets() {
    localStorage.setItem("assets", JSON.stringify(assets));
  }

  function formatDate(ts) {
    try { return new Date(ts).toLocaleString(); } catch { return ts || ""; }
  }

  function normalizeStatus(asset) {
    if (asset.status === "Deployed Available") return asset.status;
    if (asset.station && asset.station.trim() !== "") asset.status = "In Use";
    if (!asset.status || asset.status.trim() === "") asset.status = "Available";
    return asset;
  }

  // --- Login handling ---
  function applyRoleRestrictions() {
    if (!currentUser) return;
    roleIndicator.textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
    const isViewer = currentUser.role === "viewer";
    addAssetBtn.disabled = isViewer;
    deleteBtn.disabled = isViewer;
    importBtn.disabled = isViewer;
  }

  loginBtn.addEventListener("click", () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    const found = users.find(x => x.username === u && x.password === p);
    if (!found) return alert("Invalid credentials");
    currentUser = found;
    loginModal.classList.remove("show");
    mainContent.style.display = "block";
    applyRoleRestrictions();
    renderTable();
  });

  demoBtn.addEventListener("click", () => {
    document.getElementById("username").value = "admin";
    document.getElementById("password").value = "1234";
  });

  logoutBtn.addEventListener("click", () => {
    if (!confirm("Logout?")) return;
    currentUser = null;
    roleIndicator.textContent = "Not logged in";
    mainContent.style.display = "none";
    loginModal.classList.add("show");
  });

  // --- Table Rendering ---
  function updateCounters() {
    const rows = Array.from(document.querySelectorAll("#inventoryTable tbody tr")).filter(r => r.style.display !== "none");
    let a=0,u=0,d=0,p=0;
    rows.forEach(row => {
      const st = row.querySelector("[data-col='status'] span")?.textContent?.trim() || "";
      if (st === "Available") a++; 
      else if (st === "In Use") u++; 
      else if (st === "Defective") d++; 
      else if (st === "Deployed Available") p++;
    });
    document.getElementById("countAvailable").textContent = "Available: " + a;
    document.getElementById("countInUse").textContent = "In Use: " + u;
    document.getElementById("countDefective").textContent = "Defective: " + d;
    document.getElementById("countDeployed").textContent = "Deployed Available: " + p;
  }

  function renderTable() {
    const tbody = document.querySelector("#inventoryTable tbody");
    tbody.innerHTML = "";
    let list = assets.map((a,idx)=> ({a: normalizeStatus({...a}), idx}));

    const sf = filterStatus.value;
    if (sf) list = list.filter(item => item.a.status === sf);

    const ds = filterDate.value;
    if (ds === "newest") list.sort((x,y)=> new Date(y.a.date||0) - new Date(x.a.date||0));
    if (ds === "oldest") list.sort((x,y)=> new Date(x.a.date||0) - new Date(y.a.date||0));

    const q = (searchInput.value || "").toLowerCase();

    list.forEach(({a, idx})=> {
      const rowText = `${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase();
      if (q && !rowText.includes(q)) return;

      const tr = document.createElement("tr");
      tr.dataset.index = idx;
      tr.innerHTML = `
        <td><input type="checkbox" data-index="${idx}"></td>
        <td data-col="tag" class="editable">${escapeHtml(a.tag||"")}</td>
        <td data-col="assetName" class="editable">${escapeHtml(a.assetName||"")}</td>
        <td data-col="assetType" class="editable">${escapeHtml(a.assetType||"")}</td>
        <td data-col="serial" class="editable">${escapeHtml(a.serial||"")}</td>
        <td data-col="status" class="editable">
          <span class="status ${statusClassMap[a.status] || ''}">${escapeHtml(a.status||"")}</span>
        </td>
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
    saveAssets();
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  // --- Inline Editing ---
  function applyEditableState() {
    const isViewer = currentUser && currentUser.role === "viewer";
    document.querySelectorAll("#inventoryTable tbody td.editable").forEach(td => {
      if (isViewer) {
        td.removeAttribute("contenteditable");
        td.classList.remove("editable-enabled");
      } else {
        td.setAttribute("contenteditable","true");
        td.classList.add("editable-enabled");
      }
    });
  }

  document.querySelector("#inventoryTable tbody").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target && e.target.matches("td[contenteditable='true']")) {
      e.preventDefault();
      e.target.blur();
    }
  });

  document.querySelector("#inventoryTable tbody").addEventListener("focusout", (e) => {
    const cell = e.target;
    if (!cell || !cell.matches("td")) return;
    const col = cell.dataset.col;
    const row = cell.closest("tr");
    if (!row) return;
    const idx = parseInt(row.dataset.index,10);
    if (isNaN(idx)) return;
    if (!col || !["tag","assetName","assetType","serial","status","location","station","warranty","vendor","datePurchased","notes"].includes(col)) return;

    const newValue = cell.textContent.trim();
    if ((col === "tag" || col === "serial") && !newValue) {
      alert("Asset Tag and Serial cannot be empty.");
      renderTable();
      return;
    }

    assets[idx] = assets[idx] || {};
    assets[idx][col] = newValue;
    assets[idx].date = new Date().toISOString();
    saveAssets();
    renderTable();
  });

  // --- Select all ---
  selectAllCheckbox.addEventListener("change", function() {
    const checked = this.checked;
    document.querySelectorAll("#inventoryTable tbody input[type='checkbox']").forEach(cb => cb.checked = checked);
  });

  // --- Delete ---
  deleteBtn.addEventListener("click", () => {
    if (!currentUser) return alert("Please login first.");
    if (currentUser.role === "viewer") return alert("Viewer cannot delete.");
    const boxes = Array.from(document.querySelectorAll("#inventoryTable tbody input[type='checkbox']:checked"));
    if (!boxes.length) return alert("Please select at least one row to delete.");
    if (!confirm("Delete selected asset(s)?")) return;
    const idxs = boxes.map(cb=>parseInt(cb.dataset.index,10)).sort((a,b)=>b-a);
    idxs.forEach(i=> { assets.splice(i,1); });
    saveAssets();
    renderTable();
  });

  // --- Export ---
  exportBtn.addEventListener("click", ()=>{
    let csv = "Asset Tag,Asset Name,Asset Type,Serial No.,Status,Location,Station No.,Warranty,Vendor,Date Purchased,Date Added/Updated,Remarks\n";
    assets.forEach(a=> {
      const row = [
        a.tag||"", a.assetName||"", a.assetType||"", a.serial||"", a.status||"", a.location||"", a.station||"", a.warranty||"", a.vendor||"", a.datePurchased||"", formatDate(a.date)||"", a.notes||""
      ].map(v => '\"'+String(v).replace(/\"/g,'\"\"')+'\"').join(",");
      csv += row + "\n";
    });
    const blob = new Blob([csv],{type:"text/csv"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    link.download = `CFInventory_${now.getFullYear()}${now.getMonth()+1}${now.getDate()}.csv`;
    link.click();
  });

  // --- Import ---
  importBtn.addEventListener("click", ()=> {
    if (!currentUser) return alert("Please login first.");
    if (currentUser.role === "viewer") return alert("Viewer cannot import.");
    importFile.click();
  });

  importFile.addEventListener("change", e=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l=>l.trim()!=="");
      if (lines.length <=1) return alert("Empty or invalid CSV.");
      const rows = lines.slice(1);
      let added = 0;
      rows.forEach(line=> {
        const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!cols) return;
        const values = cols.map(v => (v||"").toString().replace(/^"|"$/g,"").replace(/\r|\n/g," ").trim());
        if (values.length < 12) return;
        const tag = values[0], serial = values[3];
        if (assets.some(a=>a.tag===tag || a.serial===serial)) return;
        assets.push({
          tag, assetName: values[1], assetType: values[2], serial,
          status: values[4], location: values[5], station: values[6],
          warranty: values[7], vendor: values[8], datePurchased: values[9],
          date: values[10] || new Date().toISOString(), notes: values[11]
        });
        added++;
      });
      importFile.value = "";
      saveAssets();
      renderTable();
      alert(`${added} assets imported`);
    };
    reader.readAsText(file);
  });

  // --- Add Asset Modal ---
  addAssetBtn.addEventListener("click", ()=> {
    if (!currentUser) return alert("Please login first.");
    if (currentUser.role === "viewer") return alert("Viewer cannot add assets.");
    ["add_tag","add_assetName","add_assetType","add_serial","add_status","add_location","add_station","add_warranty","add_vendor","add_datePurchased","add_notes"].forEach(id=>document.getElementById(id).value="");
    addModal.classList.add("show");
  });

  closeAdd.addEventListener("click", ()=> addModal.classList.remove("show"));

  addSaveBtn.addEventListener("click", ()=> {
    const asset = {
      tag: document.getElementById("add_tag").value.trim(),
      assetName: document.getElementById("add_assetName").value.trim(),
      assetType: document.getElementById("add_assetType").value.trim(),
      serial: document.getElementById("add_serial").value.trim(),
      status: document.getElementById("add_status").value.trim(),
      location: document.getElementById("add_location").value.trim(),
      station: document.getElementById("add_station").value.trim(),
      warranty: document.getElementById("add_warranty").value.trim(),
      vendor: document.getElementById("add_vendor").value.trim(),
      datePurchased: document.getElementById("add_datePurchased").value || "",
      date: new Date().toISOString(),
      notes: document.getElementById("add_notes").value.trim()
    };
    if (!asset.tag || !asset.serial) return alert("Asset Tag and Serial Number are required.");
    if (assets.some(a=>a.tag===asset.tag || a.serial===asset.serial)) return alert("Duplicate Asset Tag or Serial Number detected.");
    assets.push(asset);
    saveAssets();
    addModal.classList.remove("show");
    renderTable(); // ✅ Automatically applies colored badge
  });

  // --- Click outside modal closes it ---
  document.addEventListener("click", e => {
    if (e.target === addModal) addModal.classList.remove("show");
  });

  // --- Report ---
  reportBtn.addEventListener("click", ()=> {
    const rows = Array.from(document.querySelectorAll("#inventoryTable tbody tr")).filter(r=>r.style.display!=="none");
    if (!rows.length) return alert("No data to include in report.");
    let countAvailable=0,countInUse=0,countDefective=0,countDeployed=0;
    const typeSummary = {};
    rows.forEach(r=> {
      const cells = r.querySelectorAll("td");
      const type = cells[3]?.textContent?.trim() || "Unknown";
      const status = r.querySelector("[data-col='status'] span")?.textContent?.trim() || "";
      if (status === "Available") countAvailable++;
      else if (status === "In Use") countInUse++;
      else if (status === "Defective") countDefective++;
      else if (status === "Deployed Available") countDeployed++;
      if (!typeSummary[type]) typeSummary[type] = {Available:0,"In Use":0,Defective:0,"Deployed Available":0,Total:0};
      typeSummary[type][status] = (typeSummary[type][status]||0)+1;
      typeSummary[type].Total++;
    });
    const total = rows.length;
    let breakdownHTML = "";
    for (const [type,stats] of Object.entries(typeSummary)) {
      breakdownHTML += `<div class="type-block"><h3>${type}</h3><p>Available: ${stats.Available||0}</p><p>In Use: ${stats["In Use"]||0}</p><p>Defective: ${stats.Defective||0}</p><p>Deployed Available: ${stats["Deployed Available"]||0}</p><hr><p><strong>Total: ${stats.Total||0}</strong></p></div>`;
    }
    const reportHTML = `
      <html><head><title>Inventory Report</title><style>body{font-family:Arial;padding:20px;}h1{text-align:center;color:#0056b3;}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:6px;text-align:center}th{background:#007bff;color:#fff}</style></head><body>
      <h1>CF Outsourcing Solutions - Inventory Report</h1>
      <div><p>Available: ${countAvailable}</p><p>In Use: ${countInUse}</p><p>Defective: ${countDefective}</p><p>Deployed Available: ${countDeployed}</p><p>Total: ${total}</p></div>
      <div>${breakdownHTML}</div>
      <table><thead>${document.querySelector("#inventoryTable thead").innerHTML}</thead><tbody>${rows.map(r=>r.outerHTML).join("")}</tbody></table>
      </body></html>`;
    const w = window.open("");
    w.document.write(reportHTML);
    w.document.close();
    w.print();
  });

  searchInput.addEventListener("input", renderTable);
  filterStatus.addEventListener("change", renderTable);
  filterDate.addEventListener("change", renderTable);

  // --- Ensure login shown ---
  function ensureLogin() {
    if (!currentUser) {
      loginModal.classList.add("show");
      mainContent.style.display = "none";
    } else {
      loginModal.classList.remove("show");
      mainContent.style.display = "block";
    }
  }
  ensureLogin();

  // --- Enter key login ---
  document.getElementById("username").addEventListener("keyup", e=>{ if (e.key==="Enter") loginBtn.click(); });
  document.getElementById("password").addEventListener("keyup", e=>{ if (e.key==="Enter") loginBtn.click(); });

  renderTable();
});