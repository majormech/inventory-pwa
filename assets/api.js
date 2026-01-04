// assets/api.js
export const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbxGBX9uDy17GKUPLkY_qGpgyOFnc3LgLDLrdpQaHqYaPKFLoQIjKxvpcTcUGnvXiXhx1Q/exec";

// NOTE: Use text/plain to avoid CORS preflight (Apps Script web apps don't handle OPTIONS)
export async function gas(action, payload = {}) {
  const res = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });

  // If Google sends HTML (login page), JSON parse will fail
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) {}

  if (!data || data.ok !== true) {
    const msg =
      (data && data.error) ? data.error :
      (!res.ok ? `HTTP ${res.status}` :
      "Backend returned non-JSON (deployment/auth issue).");
    // Helpful debugging:
    // console.log(text);
    throw new Error(msg);
  }
  return data;
}
