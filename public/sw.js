/*
 * GuIA service worker: works offline for pages already visited.
 * - Pages, data (?_rsc) and content banks: network first, so a new deployment is used as
 *   soon as there is a connection; the last copy is the fallback offline.
 * - /_next/static: cache first; those files have hashed names and never change.
 * Progress lives in localStorage, which this worker never touches.
 */
const STATIC = "sello-static-v1";
// Also named in src/lib/access/offline.ts, which clears it on sign-out: keep both in step.
const PAGES = "sello-pages-v1";
const LIMITS = { [STATIC]: 250, [PAGES]: 120 };

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC, PAGES]);
      for (const key of await caches.keys())
        if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function trim(name) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - LIMITS[name])))
    await cache.delete(key);
}

async function put(name, request, response) {
  if (!response.ok || response.type === "opaque") return;
  const cache = await caches.open(name);
  await cache.put(request, response);
  await trim(name);
}

const OFFLINE_HTML = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión | GuIA</title>
<body style="font-family:system-ui,sans-serif;background:#ffffff;color:#14161c;margin:0;padding:2rem;line-height:1.5">
<h1>Sin conexión</h1>
<p>Esta página aún no está guardada en tu dispositivo. Vuelve cuando tengas conexión; las páginas que ya has visitado funcionan sin red.</p>
<p lang="en">You are offline. This page has not been saved on your device yet; pages you have already visited work without a connection.</p>
<p><a href="/es/panel">Ir al panel</a> · <a href="/en/dashboard" lang="en">Go to the dashboard</a></p>
</body></html>`;

async function networkFirst(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    event.waitUntil(put(PAGES, request, response.clone()));
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (request.mode === "navigate")
      return new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    return Response.error();
  }
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  event.waitUntil(put(STATIC, event.request, response.clone()));
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;
  if (url.pathname.startsWith("/_next/static/"))
    event.respondWith(cacheFirst(event));
  else if (
    request.mode === "navigate" ||
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/banks/") ||
    url.pathname.startsWith("/icons/")
  )
    event.respondWith(networkFirst(event));
});
