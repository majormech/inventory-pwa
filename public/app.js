// Your Apps Script Web App URL:
const API_BASE = "https://script.google.com/macros/s/AKfycbxGBX9uDy17GKUPLkY_qGpgyOFnc3LgLDLrdpQaHqYaPKFLoQIjKxvpcTcUGnvXiXhx1Q/exec";

const el = (id) => document.getElementById(id);

function setPill(ok) {
  const pill = el("apiStatus");
  pill.textContent = ok ? "API OK" : "API ERR";
  pill.className = "pill " + (ok ? "ok" : "danger");
}

function loadUser() {
  const u = localStorage.getItem("inv_user") || "";
  el("user").value = u;
  el("newUser").value = u;
}

function saveUser() {
  const u = el("user").value.trim();
  localStorage.setItem("inv_user", u);
  el("newUser").value = u;
}

async function apiGet(params) {
  const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

async function apiPost(body) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function setItemView(item, stats) {
  if (!item) {
    el("item").innerHTML = "";
    return;
  }

  const onHand = Number(item.OnHand ?? item.onHand ?? 0);
  const min = Number(item.Min ?? item.min ?? 0);
  const low = onHand <= min;

  const monthlyUse = stats?.monthlyUse ?? "—";
  const days = (stats && stats.daysRemaining != null) ? stats.daysRemaining : "—";

  el("item").innerHTML = `
    <div class="card ${low ? "danger" : ""}" style="margin-top:10px">
      <div><b>${item.SKU}</b> — ${item.Name}</div>
      <div class="muted">Category: ${item.Category || "—"} | Unit: ${item.Unit || "—"} | Vendor: ${item.Vendor || "—"}</div>
      <div style="margin-top:6px">
        On hand: <b>${onHand}</b> | Min: <b>${min}</b> | ReorderQty: <b>${item.ReorderQty ?? "—"}</b>
      </div>
      <div style="margin-top:6px">
        30-day use: <b>${monthlyUse}</b> | Days remaining: <b>${days}</b>
      </div>
      ${low ? `<div style="margin-top:8px"><b>LOW STOCK</b> — this SKU will appear on the ReorderList sheet.</div>` : ""}
    </div>
  `;
}

async function pingApi() {
  try {
    // Using a safe call; refreshReorder should exist if you used the backend I gave
    const data = await apiGet({ action: "refreshReorder" });
    setPill(!!data.ok);
  } catch (e) {
    setPill(false);
  }
}

async function lookup() {
  const sku = el("sku").value.trim();
  if (!sku) return;

  const data = await apiGet({ action: "lookup", sku });
  if (!data.ok) {
    el("item").innerHTML = `<div style="margin-top:10px;color:#b30000"><b>Not found:</b> ${sku}</div>`;
    return;
  }
  setItemView(data.item, data.stats);

  // Prefill Add/Update with current SKU
  el("newSku").value = data.item.SKU || sku;
}

async function move(type) {
  const sku = el("sku").value.trim();
  const qty = Number(el("qty").value || 0);
  const note = el("note").value || "";
  const user = localStorage.getItem("inv_user") || "";

  if (!sku) return alert("Scan/enter a SKU first.");
  if (!Number.isFinite(qty) || qty <= 0) return alert("Qty must be > 0.");

  const body = { action: "move", sku, qty, type, note, user };
  const data = await apiPost(body);

  if (!data.ok) {
    alert(data.error || "Error");
    return;
  }
  await lookup();
  el("note").value = "";
}

function clearAll() {
  el("sku").value = "";
  el("qty").value = 1;
  el("note").value = "";
  el("item").innerHTML = "";
  el("sku").focus();
}

async function showLow() {
  const data = await apiGet({ action: "low" });
  if (!data.ok) return;

  if (!data.items.length) {
    el("lowList").innerHTML = "<p class='muted'>No low stock items.</p>";
    return;
  }

  el("lowList").innerHTML = data.items.map(it => `
    <div class="card danger item">
      <div><b>${it.sku}</b> — ${it.name}</div>
      <div class="muted">Vendor: ${it.vendor || "—"}</div>
      <div style="margin-top:6px">
        OnHand: <b>${it.onHand}</b> | Min: <b>${it.min}</b> | Reorder: <b>${it.reorderQty}</b>
      </div>
      <div style="margin-top:6px">
        30-day use: <b>${it.monthlyUse}</b> | Days remaining: <b>${it.daysRemaining ?? "—"}</b>
      </div>
    </div>
  `).join("");
}

function fillFromLookup() {
  // Pull values from the currently displayed lookup, by re-calling lookup and using returned item.
  // Instead of parsing HTML, just do an API lookup using the newSku.
  const sku = el("newSku").value.trim() || el("sku").value.trim();
  if (!sku) return alert("Enter/scan a SKU first.");
  apiGet({ action: "lookup", sku }).then(data => {
    if (!data.ok) return alert("SKU not found in Items.");
    const it = data.item;
    el("newSku").value = it.SKU || sku;
    el("newName").value = it.Name || "";
    el("newCategory").value = it.Category || "";
    el("newUnit").value = it.Unit || "";
    el("newOnHand").value = Number(it.OnHand || 0);
    el("newMin").value = Number(it.Min || 0);
    el("newReorderQty").value = Number(it.ReorderQty || 0);
    el("newVendor").value = it.Vendor || "";
    el("newLeadTimeDays").value = Number(it.LeadTimeDays || 0);
    el("newUser").value = localStorage.getItem("inv_user") || "";
    el("saveMsg").textContent = "Filled from existing item.";
  });
}

async function saveItem() {
  const payload = {
    action: "upsert",
    SKU: el("newSku").value.trim(),
    Name: el("newName").value.trim(),
    Category: el("newCategory").value.trim(),
    Unit: el("newUnit").value.trim(),
    OnHand: Number(el("newOnHand").value || 0),
    Min: Number(el("newMin").value || 0),
    ReorderQty: Number(el("newReorderQty").value || 0),
    Vendor: el("newVendor").value.trim(),
    LeadTimeDays: Number(el("newLeadTimeDays").value || 0),
    user: el("newUser").value.trim() || (localStorage.getItem("inv_user") || "")
  };

  if (!payload.SKU) return alert("SKU is required.");
  if (!payload.Name) return alert("Name is required.");

  const res = await apiPost(payload);
  if (!res.ok) {
    el("saveMsg").textContent = "Error: " + (res.error || "Unknown error");
    return;
  }

  el("saveMsg").textContent = res.created ? `Created ${payload.SKU}` : `Updated ${payload.SKU}`;
  // Also set the active scan SKU for quick actions
  el("sku").value = payload.SKU;
  await lookup();
}

// Events
el("saveUser").addEventListener("click", saveUser);
el("ping").addEventListener("click", pingApi);
el("lookup").addEventListener("click", lookup);
el("clear").addEventListener("click", clearAll);

el("btnOut").addEventListener("click", () => move("OUT"));
el("btnIn").addEventListener("click", () => move("IN"));
el("btnAdj").addEventListener("click", () => move("ADJUST"));

el("low").addEventListener("click", showLow);

el("saveItem").addEventListener("click", saveItem);
el("fillFromLookup").addEventListener("click", fillFromLookup);

// Scanner behavior: Enter key triggers lookup
el("sku").addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookup();
});

// Convenience: keep newSku synced when scanning
el("sku").addEventListener("input", () => {
  el("newSku").value = el("sku").value.trim();
});

// PWA SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

loadUser();
pingApi();
