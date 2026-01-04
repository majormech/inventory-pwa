export const GAS_PROXY_URL = "/gas";

export async function gas(action, payload = {}) {
  let res;
  try {
    res = await fetch(GAS_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (err) {
    // Network-level failure (proxy not deployed, offline, etc.)
    throw new Error("Failed to fetch /gas (proxy missing or deployment failed).");
  }

  const text = await res.text();

  // Try JSON parse
  let data = null;
  try { data = JSON.parse(text); } catch (_) {}

  // Handle non-OK HTTP status
  if (!res.ok) {
    throw new Error(`Proxy error HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  // Handle backend non-JSON (often Google login HTML)
  if (!data) {
    throw new Error("Backend returned non-JSON (check GAS deployment access).");
  }

  // Handle your app-level errors
  if (data.ok !== true) {
    throw new Error(data.error || "Backend error");
  }

  return data;
}
