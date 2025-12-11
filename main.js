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
const loginModalInstance = new bootstrap.Modal(loginModal, { backdrop: "static", keyboard: false });
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

    const newOkBtn = alertModalOk.cloneNode(true);
    alertModalOk.parentNode.replaceChild(newOkBtn, alertModalOk);

    newOkBtn.addEventListener("click", () => {
        alertModalInstance.hide();
        onConfirm();
    }, { once: true });

    alertModalInstance.show();
}

alertModal.addEventListener("hidden.bs.modal", () => {
    document.getElementById("alertModalOk").textContent = "OK";
});

// --- Helpers ---
function formatDate(ts) {
    if (!ts) return "";
    try {
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "";
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
        loginModalInstance.show();
        mainContent.classList.add("d-none");
    } else {
        loginModalInstance.hide();
        mainContent.classList.remove("d-none");
    }
}

// --- LOGIN BUTTON ---
loginBtn.addEventListener("click", async () => {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    const found = users.find(x => x.username === u && x.password === p);
    if (!found) {
        showAlert("Error, Invalid login credentials", "error");
        return;
    }
    currentUser = found;
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    loginModalInstance.hide();
    mainContent.classList.remove("d-none");
    applyRoleRestrictions();
    await loadAssets();
});

// --- DEMO LOGIN ---
demoBtn.addEventListener("click", () => {
    if (users.length > 0) {
        const firstUser = users[0];
        document.getElementById("username").value = firstUser.username;
        document.getElementById("password").value = firstUser.password;
    } else {
        showAlert("No demo users available. Please set up the database first.", "warning");
    }
});

// --- LOGOUT ---
logoutBtn.addEventListener("click", () => {
    showConfirm("Are you sure you want to logout?", () => {
        currentUser = null;
        sessionStorage.removeItem("currentUser");
        ensureLogin();
        applyRoleRestrictions();
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

// --- Render table function (unchanged) ---
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

// --- Edit modal functions remain unchanged ---
// --- Add asset, delete, import, export, report functions remain unchanged ---

// --- Initialize ---
async function init() {
    users = await fetchUsers();
    if (users.length === 0) {
        console.warn("No users found in database. Please run the SQL to create users table and insert users.");
    }
    ensureLogin();
    if (currentUser) {
        applyRoleRestrictions();
        loadAssets();
    }
}

// --- Real-time refresh ---
setInterval(async () => { if (currentUser) await loadAssets(); }, 60000);

init();
