// assets/app.js
import { gas } from "./api.js";

export function setActiveTab(pathname) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.getAttribute("href") === pathname);
  });
}

export function toast(msg) {
  alert(msg); // simple; can replace with nicer toast later
}

// Store user name locally (optional)
export function getWho() {
  return localStorage.getItem("who") || "";
}
export function setWho(v) {
  localStorage.setItem("who", v || "");
}

// --- Parse / store extra WO fields in Notes as JSON (Option A; no backend patch needed)
export function packWoMeta(meta) {
  return JSON.stringify({ __meta: meta }, null, 0);
}
export function unpackWoMeta(notes) {
  try {
    const obj = JSON.parse(notes || "{}");
    if (obj && obj.__meta) return obj.__meta;
  } catch (_) {}
  return {};
}

// --- Load Products and WorkOrders
export async function loadProducts() {
  const data = await gas("listProducts");
  return data.products || [];
}

export async function loadWorkOrders() {
  const data = await gas("listWorkOrders");
  return data.workOrders || [];
}

export async function loadInventory() {
  const data = await gas("listInventory");
  return data.inventory || [];
}

// --- Allocation / “pending needed” calculations from open orders and BOM
// Open statuses to allocate: NEW, IN PROGRESS, BUILT (until you consume)
export const ALLOC_STATUSES = new Set(["NEW","IN PROGRESS","BUILT"]);

export async function buildBomCache(workOrders) {
  // minimal caching: fetch product BOM once per productId
  const cache = new Map(); // productId -> { bom: [{sku, qtyPerProduct}], needsThreadColor }
  for (const wo of workOrders) {
    if (!ALLOC_STATUSES.has(String(wo.status || "").toUpperCase())) continue;
    if (!cache.has(wo.productId)) {
      const p = await gas("getProduct", { productId: wo.productId });
      cache.set(wo.productId, { bom: p.bom || [], needsThreadColor: !!p.needsThreadColor });
    }
  }
  return cache;
}

export function computeAllocations(workOrders, bomCache) {
  // returns:
  // skuAlloc[sku] = total qty needed across open orders
  // orderNeeds[woId] = [{sku, qtyNeeded}]
  const skuAlloc = {};
  const orderNeeds = {};

  for (const wo of workOrders) {
    const status = String(wo.status || "").toUpperCase();
    if (!ALLOC_STATUSES.has(status)) continue;

    const qty = Number(wo.qty || 0);
    if (!qty || qty <= 0) continue;

    const bomEntry = bomCache.get(wo.productId);
    const bom = (bomEntry && bomEntry.bom) ? bomEntry.bom : [];

    const needs = [];
    for (const line of bom) {
      const sku = String(line.sku || "").trim();
      const per = Number(line.qtyPerProduct || 0);
      if (!sku || !per) continue;

      // NOTE: thread color selection affects which SKU is used at consume time.
      // For allocations, we still count it against the default thread SKU so you see demand.
      const needQty = round(per * qty, 4);
      needs.push({ sku, qty: needQty });

      skuAlloc[sku] = round((skuAlloc[sku] || 0) + needQty, 4);
    }

    orderNeeds[wo.woId] = needs;
  }

  return { skuAlloc, orderNeeds };
}

export function round(n, p=4) {
  const m = 10 ** p;
  return Math.round((Number(n) + Number.EPSILON) * m) / m;
}
