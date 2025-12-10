import { fetchAssets, addAsset, updateAsset, deleteSelected, fetchUsers } from "./supabase.js";

// --- Users & roles (fetched from database) ---
let users = [];

// --- Status CSS mapping ---
const statusClassMap = {
    "In Use": "in-use",
    "Available": "available",
    "Defective": "defective",
    "Deployed Available": "deployed"
};

// --- State ---
let assets = [];
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;

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
const addModalInstance = new bootstrap.Modal(addModal);
const closeAdd = document.getElementById("closeAdd");
const closeAddBtn = document.getElementById("closeAddBtn");
const addSaveBtn = document.getElementById("addSaveBtn");
const roleIndicator = document.getElementById("roleIndicator");
const reportBtn = document.getElementById("reportBtn");

// Edit modal elements
const editModal = document.getElementById("editModal");
const editModalInstance = new bootstrap.Modal(editModal);
const closeEdit = document.getElementById("closeEdit");
const closeEditBtn = document.getElementById("closeEditBtn");
const editSaveBtn = document.getElementById("editSaveBtn");

// --- Loading overlay ---
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

function showLoading(message = "Loading...") {
    loadingText.textContent = message;
    loadingOverlay.classList.add("show");
}

function hideLoading() {
    loadingOverlay.classList.remove("show");
}

// --- Alert Modal ---
const alertModal = document.getElementById("alertModal");
const alertModalInstance = new bootstrap.Modal(alertModal);
const alertModalHeader = document.getElementById("alertModalHeader");
const alertModalIcon = document.getElementById("alertModalIcon");
const alertModalTitleText = document.getElementById("alertModalTitleText");
const alertModalMessage = document.getElementById("alertModalMessage");
const alertModalOk = document.getElementById("alertModalOk");
const alertModalCancel = document.getElementById("alertModalCancel");

function showAlert(message, type = "info") {
    const config = {
        info: { bg: "bg-primary", icon: "bi-info-circle", title: "Notice", btnClass: "btn-primary" },
        success: { bg: "bg-success", icon: "bi-check-circle", title: "Success", btnClass: "btn-success" },
        warning: { bg: "bg-warning", icon: "bi-exclamation-triangle", title: "Warning", btnClass: "btn-warning" },
        error: { bg: "bg-danger", icon: "bi-x-circle", title: "Error", btnClass: "btn-danger" }
    };
    const c = config[type] || config.info;

    alertModalHeader.className = `modal-header ${c.bg} text-white`;
    alertModalIcon.className = `bi ${c.icon} me-2`;
    alertModalTitleText.textContent = c.title;
    alertModalMessage.textContent = message;
    alertModalOk.className = `btn ${c.btnClass}`;
    alertModalCancel.style.display = "none";

    alertModalInstance.show();
}

function showConfirm(message, onConfirm) {
    alertModalHeader.className = "modal-header bg-warning text-dark";
    alertModalIcon.className = "bi bi-question-circle me-2";
    alertModalTitleText.textContent = "Confirm";
    alertModalMessage.textContent = message;
    alertModalOk.className = "btn btn-danger";
    alertModalOk.textContent = "Yes";
    alertModalCancel.style.display = "inline-block";

    // Remove old listener and add new one
    const newOkBtn = alertModalOk.cloneNode(true);
    alertModalOk.parentNode.replaceChild(newOkBtn, alertModalOk);

    newOkBtn.addEventListener("click", () => {
        alertModalInstance.hide();
        onConfirm();
    }, { once: true });

    alertModalInstance.show();
}

// Reset OK button text when modal closes
alertModal.addEventListener("hidden.bs.modal", () => {
    document.getElementById("alertModalOk").textContent = "OK";
});

// --- Helpers ---
function formatDate(ts) {
    if (!ts) return "";
    try {
        const date = new Date(ts);
        if (isNaN(date.getTime())) return ""; // Invalid date
        return date.toLocaleString();
    } catch {
        return "";
    }
}

function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function normalizeStatus(asset) {
    if (asset.status === "Deployed Available") return asset.status;
    if (asset.station && asset.station.trim() !== "") asset.status = "In Use";
    if (!asset.status || asset.status.trim() === "") asset.status = "Available";
    return asset;
}

// --- Role restrictions ---
function applyRoleRestrictions() {
    if (!currentUser) return;
    const roleIcon = currentUser.role === "admin" ? "shield-fill" : currentUser.role === "user" ? "person-fill" : "eye-fill";
    roleIndicator.innerHTML = `<i class="bi bi-${roleIcon} me-1"></i>${currentUser.username} (${currentUser.role})`;
    const isViewer = currentUser.role === "viewer";
    addAssetBtn.disabled = isViewer;
    deleteBtn.disabled = isViewer;
    importBtn.disabled = isViewer;
}

// --- Login handling ---
function ensureLogin() {
    if (!currentUser) {
        loginModal.classList.add("show");
        mainContent.classList.add("d-none");
    } else {
        loginModal.classList.remove("show");
        mainContent.classList.remove("d-none");
    }
}

loginBtn.addEventListener("click", async () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    const found = users.find(x => x.username === u && x.password === p);
    if (!found) {
        showAlert("Invalid credentials", "error");
        return;
    }
    currentUser = found;
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    loginModal.classList.remove("show");
    mainContent.classList.remove("d-none");
    applyRoleRestrictions();
    await loadAssets();
});

demoBtn.addEventListener("click", () => {
    document.getElementById("username").value = "admin";
    document.getElementById("password").value = "@dmin2026";
});

logoutBtn.addEventListener("click", () => {
    showConfirm("Are you sure you want to logout?", () => {
        currentUser = null;
        sessionStorage.removeItem("currentUser");
        roleIndicator.innerHTML = '<i class="bi bi-person-circle me-1"></i>Not logged in';
        mainContent.classList.add("d-none");
        loginModal.classList.add("show");
    });
});

document.getElementById("username").addEventListener("keyup", e => {
    if (e.key === "Enter") loginBtn.click();
});

document.getElementById("password").addEventListener("keyup", e => {
    if (e.key === "Enter") loginBtn.click();
});

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
    const rows = Array.from(document.querySelectorAll("#inventoryTable tbody tr"))
        .filter(r => r.style.display !== "none");
    let a = 0, u = 0, d = 0, p = 0;
    rows.forEach(row => {
        const st = row.querySelector("[data-col='status'] span")?.textContent?.trim() || "";
        if (st === "Available") a++;
        else if (st === "In Use") u++;
        else if (st === "Defective") d++;
        else if (st === "Deployed Available") p++;
    });
    document.getElementById("countAvailable").textContent = a;
    document.getElementById("countInUse").textContent = u;
    document.getElementById("countDefective").textContent = d;
    document.getElementById("countDeployed").textContent = p;
}

function renderTable() {
    const tbody = document.querySelector("#inventoryTable tbody");
    tbody.innerHTML = "";
    const isViewer = currentUser && currentUser.role === "viewer";

    let list = assets.map((a, idx) => ({ a: normalizeStatus({ ...a }), idx }));
    const sf = filterStatus.value;
    if (sf) list = list.filter(item => item.a.status === sf);

    const ds = filterDate.value;
    if (ds === "newest") list.sort((x, y) => new Date(y.a.date || 0) - new Date(x.a.date || 0));
    if (ds === "oldest") list.sort((x, y) => new Date(x.a.date || 0) - new Date(y.a.date || 0));

    const q = (searchInput.value || "").toLowerCase();

    list.forEach(({ a, idx }) => {
        const rowText = `${a.tag} ${a.assetName} ${a.assetType} ${a.serial} ${a.status} ${a.location} ${a.station} ${a.warranty} ${a.vendor} ${a.datePurchased} ${a.date} ${a.notes}`.toLowerCase();
        if (q && !rowText.includes(q)) return;

        const tr = document.createElement("tr");
        tr.dataset.index = idx;
        tr.dataset.id = a.id;
        tr.innerHTML = `
            <td><input type="checkbox" data-index="${idx}" data-id="${a.id}"></td>
            <td data-col="tag">${escapeHtml(a.tag || "")}</td>
            <td data-col="assetName">${escapeHtml(a.assetName || "")}</td>
            <td data-col="assetType">${escapeHtml(a.assetType || "")}</td>
            <td data-col="serial">${escapeHtml(a.serial || "")}</td>
            <td data-col="status"><span class="status ${statusClassMap[a.status] || ''}">${escapeHtml(a.status || "")}</span></td>
            <td data-col="location">${escapeHtml(a.location || "")}</td>
            <td data-col="station">${escapeHtml(a.station || "")}</td>
            <td data-col="warranty">${escapeHtml(a.warranty || "")}</td>
            <td data-col="vendor">${escapeHtml(a.vendor || "")}</td>
            <td data-col="datePurchased">${escapeHtml(a.datePurchased || "")}</td>
            <td data-col="date">${escapeHtml(formatDate(a.date) || "")}</td>
            <td data-col="notes">${escapeHtml(a.notes || "")}</td>
            <td class="edit-col">
                ${!isViewer ? `<button class="btn btn-sm btn-outline-primary btn-edit" onclick="openEditModal('${a.id}')"><i class="bi bi-pencil"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateCounters();
}

// --- Edit Modal Functions ---
window.openEditModal = function(id) {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;

    document.getElementById("edit_id").value = id;
    document.getElementById("edit_tag").value = asset.tag || "";
    document.getElementById("edit_assetName").value = asset.assetName || "";
    document.getElementById("edit_assetType").value = asset.assetType || "";
    document.getElementById("edit_serial").value = asset.serial || "";
    document.getElementById("edit_status").value = asset.status || "";
    document.getElementById("edit_location").value = asset.location || "";
    document.getElementById("edit_station").value = asset.station || "";
    document.getElementById("edit_warranty").value = asset.warranty || "";
    document.getElementById("edit_vendor").value = asset.vendor || "";
    document.getElementById("edit_datePurchased").value = asset.datePurchased || "";
    document.getElementById("edit_notes").value = asset.notes || "";

    editModalInstance.show();
};

closeEdit.addEventListener("click", () => editModalInstance.hide());
closeEditBtn.addEventListener("click", () => editModalInstance.hide());

editSaveBtn.addEventListener("click", async () => {
    const id = document.getElementById("edit_id").value;
    const updatedAsset = {
        tag: document.getElementById("edit_tag").value.trim(),
        assetName: document.getElementById("edit_assetName").value.trim(),
        assetType: document.getElementById("edit_assetType").value.trim(),
        serial: document.getElementById("edit_serial").value.trim(),
        status: document.getElementById("edit_status").value.trim(),
        location: document.getElementById("edit_location").value.trim(),
        station: document.getElementById("edit_station").value.trim(),
        warranty: document.getElementById("edit_warranty").value.trim(),
        vendor: document.getElementById("edit_vendor").value.trim(),
        datePurchased: document.getElementById("edit_datePurchased").value || "",
        notes: document.getElementById("edit_notes").value.trim()
    };

    if (!updatedAsset.tag || !updatedAsset.serial) {
        showAlert("Asset Tag and Serial Number are required.", "warning");
        return;
    }

    await updateAsset(id, updatedAsset);
    editModalInstance.hide();

    // Update local array instead of re-fetching
    const idx = assets.findIndex(a => a.id === id);
    if (idx !== -1) {
        assets[idx] = { ...assets[idx], ...updatedAsset, date: new Date().toISOString() };
    }
    renderTable();
    showAlert("Asset updated successfully!", "success");
});

// --- Select all ---
selectAllCheckbox.addEventListener("change", function() {
    const checked = this.checked;
    document.querySelectorAll("#inventoryTable tbody input[type='checkbox']").forEach(cb => cb.checked = checked);
});

// --- Delete ---
deleteBtn.addEventListener("click", async () => {
    if (!currentUser) { showAlert("Please login first.", "warning"); return; }
    if (currentUser.role === "viewer") { showAlert("Viewer cannot delete.", "warning"); return; }
    const boxes = Array.from(document.querySelectorAll("#inventoryTable tbody input[type='checkbox']:checked"));
    if (!boxes.length) { showAlert("Please select at least one row to delete.", "info"); return; }

    showConfirm("Are you sure you want to delete the selected asset(s)?", async () => {
        const ids = boxes.map(cb => cb.dataset.id).filter(Boolean);
        await deleteSelected(ids);
        await loadAssets();
        showAlert("Asset(s) deleted successfully!", "success");
    });
});

// --- Export ---
exportBtn.addEventListener("click", () => {
    let csv = "Asset Tag,Asset Name,Asset Type,Serial No.,Status,Location,Station No.,Warranty,Vendor,Date Purchased,Date Added/Updated,Remarks\n";
    assets.forEach(a => {
        const row = [
            a.tag || "", a.assetName || "", a.assetType || "", a.serial || "", a.status || "", a.location || "", 
            a.station || "", a.warranty || "", a.vendor || "", a.datePurchased || "", formatDate(a.date) || "", a.notes || ""
        ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
        csv += row + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    link.download = `CFInventory_${now.getFullYear()}${now.getMonth()+1}${now.getDate()}.csv`;
    link.click();
});

// --- Import ---
importBtn.addEventListener("click", () => {
    if (!currentUser) { showAlert("Please login first.", "warning"); return; }
    if (currentUser.role === "viewer") { showAlert("Viewer cannot import.", "warning"); return; }
    importFile.click();
});

importFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const text = ev.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length <= 1) { showAlert("Empty or invalid CSV.", "error"); return; }
        const rows = lines.slice(1);
        showLoading(`Importing 0 / ${rows.length} assets...`);
        let added = 0, skippedNoCols = 0, skippedShortRow = 0, skippedDuplicate = 0, failed = 0;
        for (let i = 0; i < rows.length; i++) {
            const line = rows[i];
            const values = [];
            let current = "", inQuotes = false;
            for (let j = 0; j <= line.length; j++) {
                const char = line[j];
                if (char === '"') inQuotes = !inQuotes;
                else if ((char === ',' || j === line.length) && !inQuotes) { values.push(current.replace(/^"|"$/g, "").replace(/""/g, '"').trim()); current = ""; }
                else if (char !== undefined) current += char;
            }
            if (values.length < 12) { skippedShortRow++; continue; }
            const tag = values[0], serial = values[3];
            if (assets.some(a => a.tag === tag || a.serial === serial)) { skippedDuplicate++; continue; }
            const assetData = {
                tag, assetName: values[1], assetType: values[2], serial, status: values[4], location: values[5],
                station: values[6], warranty: values[7], vendor: values[8], datePurchased: values[9],
                date: values[10] || new Date().toISOString(), notes: values[11]
            };
            const success = await addAsset(assetData); if (success) added++; else failed++;
            showLoading(`Importing ${i+1} / ${rows.length} assets...\n(${added} added)`);
        }
        importFile.value = "";
        await loadAssets();
        hideLoading();
        showAlert(`Import complete!\n\nAdded: ${added}\nSkipped (duplicate): ${skippedDuplicate}\nSkipped (parse error): ${skippedNoCols+skippedShortRow}\nFailed: ${failed}`, "success");
    };
    reader.readAsText(file);
});

// --- Add Asset ---
addAssetBtn.addEventListener("click", () => {
    if (!currentUser) { showAlert("Please login first.", "warning"); return; }
    if (currentUser.role === "viewer") { showAlert("Viewer cannot add assets.", "warning"); return; }
    ["add_tag","add_assetName","add_assetType","add_serial","add_status","add_location","add_station","add_warranty","add_vendor","add_datePurchased","add_notes"]
        .forEach(id => document.getElementById(id).value = "");
    addModalInstance.show();
});

closeAdd.addEventListener("click", () => addModalInstance.hide());
closeAddBtn.addEventListener("click", () => addModalInstance.hide());

addSaveBtn.addEventListener("click", async () => {
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
    if (!asset.tag || !asset.serial) { showAlert("Asset Tag and Serial Number are required.", "warning"); return; }
    if (assets.some(a => a.tag === asset.tag || a.serial === asset.serial)) { showAlert("Duplicate Asset Tag or Serial Number detected.", "error"); return; }
    await addAsset(asset);
    addModalInstance.hide();
    await loadAssets();
    showAlert("Asset added successfully!", "success");
});

// --- Report ---
reportBtn.addEventListener("click", () => {
    const rows = Array.from(document.querySelectorAll("#inventoryTable tbody tr")).filter(r => r.style.display !== "none");
    if (!rows.length) { showAlert("No data to include in report.", "info"); return; }
    let countAvailable = 0, countInUse = 0, countDefective = 0, countDeployed = 0, typeSummary = {};
    rows.forEach(r => {
        const cells = r.querySelectorAll("td");
        const type = cells[3]?.textContent?.trim() || "Unknown";
        const status = r.querySelector("[data-col='status'] span")?.textContent?.trim() || "";
        if (status === "Available") countAvailable++;
        else if (status === "In Use") countInUse++;
        else if (status === "Defective") countDefective++;
        else if (status === "Deployed Available") countDeployed++;
        if (!typeSummary[type]) typeSummary[type] = { Available:0,"In Use":0,Defective:0,"Deployed Available":0,Total:0 };
        typeSummary[type][status] = (typeSummary[type][status]||0)+1;
        typeSummary[type].Total++;
    });
    const total = rows.length;
    let breakdownHTML = "";
    for (const [type, stats] of Object.entries(typeSummary)) {
        breakdownHTML += `<div class="type-block"><h3>${type}</h3><p>Available: ${stats.Available||0}</p><p>In Use: ${stats["In Use"]||0}</p><p>Defective: ${stats.Defective||0}</p><p>Deployed Available: ${stats["Deployed Available"]||0}</p><hr><p><strong>Total: ${stats.Total||0}</strong></p></div>`;
    }
    // Clone thead and remove edit column
    const theadClone = document.querySelector("#inventoryTable thead").cloneNode(true);
    theadClone.querySelectorAll(".edit-col").forEach(el => el.remove());

    // Clone rows and remove edit column
    const rowsHtml = rows.map(r => {
        const clone = r.cloneNode(true);
        clone.querySelectorAll(".edit-col").forEach(el => el.remove());
        return clone.outerHTML;
    }).join("");

    const reportHTML = `
        <html><head><title>Inventory Report</title>
            <style>body{font-family:Arial;padding:20px;}h1{text-align:center;color:#0056b3;}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:6px;text-align:center}th{background:#007bff;color:#fff}</style>
        </head>
            <body>
                <h1>CF Outsourcing Solutions - Inventory Report</h1>
                <div><p>Available: ${countAvailable}</p><p>In Use: ${countInUse}</p><p>Defective: ${countDefective}</p><p>Deployed Available: ${countDeployed}</p><p>Total: ${total}</p></div>
                <div>${breakdownHTML}</div>
                <table><thead>${theadClone.innerHTML}</thead><tbody>${rowsHtml}</tbody></table>
            </body>
        </html>`;
    const w = window.open("");
    w.document.write(reportHTML);
    w.document.close();
    w.print();
});

// --- Filters & search ---
searchInput.addEventListener("input", () => loadAssets());
filterStatus.addEventListener("change", () => loadAssets());
filterDate.addEventListener("change", () => loadAssets());

// --- Initialize ---
async function init() {
    // Load users from database
    users = await fetchUsers();
    // console.log("Loaded users from database:", users.length);

    if (users.length === 0) {
        console.warn("No users found in database. Please run the SQL to create users table and insert users.");
    }

    ensureLogin();
    if (currentUser) {
        applyRoleRestrictions();
        loadAssets();
    }
}

init();

// --- Real-time refresh every 60 seconds ---
setInterval(async () => { if (currentUser) await loadAssets(); }, 60000);
