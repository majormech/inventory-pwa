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
    throw new Error((data && data.error) ? data.error : "Backend error");
  }
  return data;
}
