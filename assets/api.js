// assets/api.js
export const GAS_PROXY_URL = "/gas";

export async function gas(action, payload = {}) {
  const res = await fetch(GAS_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) {}

  if (!data || data.ok !== true) {
    const msg =
      (data && data.error) ? data.error :
      (!res.ok ? `HTTP ${res.status}` :
      "Backend returned non-JSON.");
    throw new Error(msg);
  }
  return data;
}
