// assets/api.js
export const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxGBX9uDy17GKUPLkY_qGpgyOFnc3LgLDLrdpQaHqYaPKFLoQIjKxvpcTcUGnvXiXhx1Q/exec";

// Helper: call GAS with action and JSON body
export async function gas(action, payload = {}) {
  const res = await fetch(GAS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!data || data.ok !== true) {
    const msg = (data && data.error) ? data.error : "Unknown backend error";
    throw new Error(msg);
  }
  return data;
}
