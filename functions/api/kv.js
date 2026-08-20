// Cloudflare Pages Function: /api/kv
// Richiede un binding KV chiamato PC_KV (vedi wrangler.toml / dashboard Cloudflare Pages > Settings > Functions > KV bindings)
//
// GET    /api/kv?key=xxx          -> { value }
// GET    /api/kv?list=1&prefix=x  -> { keys: [...] }
// POST   /api/kv   body {key,value} -> upsert
// DELETE /api/kv?key=xxx          -> elimina

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.PC_KV) {
    return new Response(JSON.stringify({ error: "KV namespace 'PC_KV' non configurato" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "GET") {
    if (url.searchParams.get("list")) {
      const prefix = url.searchParams.get("prefix") || "";
      const listed = await env.PC_KV.list({ prefix });
      const keys = listed.keys.map((k) => k.name);
      return json({ keys });
    }
    const key = url.searchParams.get("key");
    if (!key) return json({ error: "key mancante" }, 400);
    const value = await env.PC_KV.get(key);
    if (value === null) return json({ error: "not found" }, 404);
    return json({ key, value });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !body.key) return json({ error: "body non valido" }, 400);
    await env.PC_KV.put(body.key, body.value ?? "");
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    const key = url.searchParams.get("key");
    if (!key) return json({ error: "key mancante" }, 400);
    await env.PC_KV.delete(key);
    return json({ ok: true });
  }

  return json({ error: "metodo non supportato" }, 405);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
