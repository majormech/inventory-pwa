export async function onRequest(context) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbxGBX9uDy17GKUPLkY_qGpgyOFnc3LgLDLrdpQaHqYaPKFLoQIjKxvpcTcUGnvXiXhx1Q/exec";

  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors_() });
  }

  const body = await context.request.text();

  const upstream = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body
  });

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      ...cors_(),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function cors_() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

