// Signals service worker: shows web-push notifications and keeps the app shell available offline. Never caches API calls.
const V = "signals-v4", SHELL = ["/", "/index.html", "/app.css", "/app.js", "/manifest.webmanifest", "/icons/home-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;           // API lives on another origin: always live
  if (e.request.mode === "navigate") { e.respondWith(fetch(e.request, { cache: "no-store" }).catch(() => caches.match("/index.html"))); return; }
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("/index.html"))));
});
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Signals", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Signals", { body: d.body || "", tag: d.tag || "signal", renotify: true, icon: "/icons/home-192.png", badge: "/icons/badge.png", data: { url: d.url || "/" }, timestamp: Date.now() }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ("focus" in c) { c.postMessage({ open: url }); return c.focus(); } } return self.clients.openWindow(url); }));
});
