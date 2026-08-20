// Polyfill di window.storage per l'uso fuori da Claude.ai.
// - shared = true  -> salvato lato server su Cloudflare KV (visibile a tutti i dispositivi)
// - shared = false -> salvato in localStorage (solo su questo dispositivo/browser)
//
// Se l'app venisse eventualmente aperta dentro Claude.ai, window.storage esiste già
// nativamente: questo file non sovrascrive nulla in quel caso.

if (typeof window !== "undefined" && !window.storage) {
  const API_BASE = "/api/kv";

  function localKey(key) {
    return `pcstorage:${key}`;
  }

  window.storage = {
    async get(key, shared = false) {
      if (!shared) {
        const raw = localStorage.getItem(localKey(key));
        if (raw === null) throw new Error("not found");
        return { key, value: raw, shared: false };
      }
      const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`);
      if (res.status === 404) throw new Error("not found");
      if (!res.ok) throw new Error("storage error " + res.status);
      const data = await res.json();
      return { key, value: data.value, shared: true };
    },

    async set(key, value, shared = false) {
      if (!shared) {
        localStorage.setItem(localKey(key), value);
        return { key, value, shared: false };
      }
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("storage error " + res.status);
      return { key, value, shared: true };
    },

    async delete(key, shared = false) {
      if (!shared) {
        const existed = localStorage.getItem(localKey(key)) !== null;
        localStorage.removeItem(localKey(key));
        return { key, deleted: existed, shared: false };
      }
      const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("storage error " + res.status);
      return { key, deleted: true, shared: true };
    },

    async list(prefix = "", shared = false) {
      if (!shared) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(localKey(prefix))) keys.push(k.replace("pcstorage:", ""));
        }
        return { keys, prefix, shared: false };
      }
      const res = await fetch(`${API_BASE}?list=1&prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) throw new Error("storage error " + res.status);
      const data = await res.json();
      return { keys: data.keys || [], prefix, shared: true };
    },
  };
}
