export async function onRequest(context) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbxGBX9uDy17GKUPLkY_qGpgyOFnc3LgLDLrdpQaHqYaPKFLoQIjKxvpcTcUGnvXiXhx1Q/exec";

  // Handle preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders_(),
    });
  }

  let bodyText = "";
  try {
    bodyText = await context.request.text();
  } catch (_) {}

  const upstream = await fetch(GAS_URL, {
    method: "POST",
    headers: {
      // Keep it simple; Apps Script will read postData.contents
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: bodyText,
  });

  const respText = await upstream.text();

  // Return upstream body but with CORS headers so the browser allows it
  return new Response(respText, {
    status: upstream.status,
    headers: {
      ...corsHeaders_(),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function corsHeaders_() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
