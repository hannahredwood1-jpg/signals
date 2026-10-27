"use strict";
// Signals by FLOWMTD: members page. Talks only to the Signals API (Supabase edge function). No stats or backtest numbers are shown here, only entered results.
const API = "https://gtzwxamwnuxjnamwmtyn.supabase.co/functions/v1/signals-api";
const RBX_API = "https://gtzwxamwnuxjnamwmtyn.supabase.co/functions/v1/rbx-api"; // admin-only RBX reviews
const ET = "America/New_York";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const S = { cfg: null, token: ls("sg_token"), me: null, rows: [], tab: "signals", filter: "all", sig: "", outlook: null, stats: null, open: new Set(), admin: { sessions: null, signals: null, members: null }, push: { state: "unknown" }, saveT: null };
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } return null; }
const deviceId = () => { let d = ls("sg_dev"); if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); ls("sg_dev", d); } return d; };

/* ---------- api ---------- */
async function api(path, o = {}) {
  const h = { "Content-Type": "application/json" }; if (S.token && o.auth !== false) h.Authorization = "Bearer " + S.token;
  const r = await fetch(API + path, { method: o.method || "GET", headers: h, body: o.body ? JSON.stringify(o.body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && o.auth !== false) { signedOut(j.error === "signed_in_elsewhere" ? "You signed in on another device, so this one was signed out. Signals works on one device at a time." : ""); throw new Error("login"); }
  if (!r.ok) throw Object.assign(new Error(j.error || "error"), { data: j, status: r.status });
  return j;
}
function signedOut(msg) { S.token = null; S.me = null; ls("sg_token", null); clearInterval(S.poll); renderLogin(msg); }

/* ---------- format ---------- */
const fT = new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit" });
const fD = new Intl.DateTimeFormat("en-CA", { timeZone: ET, year: "numeric", month: "2-digit", day: "2-digit" });
const fDl = new Intl.DateTimeFormat("en-US", { timeZone: ET, weekday: "long", month: "short", day: "numeric" });
const px = (v) => (v == null || v === "" ? "-" : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
function dayLabel(iso) { const d = new Date(iso), t = fD.format(new Date()), y = fD.format(new Date(Date.now() - 864e5)), k = fD.format(d); return k === t ? "Today" : k === y ? "Yesterday" : fDl.format(d); }
const mm = (m) => { const h = Math.floor(m / 60), x = m % 60, ap = h >= 12 ? "PM" : "AM"; return `${((h + 11) % 12) + 1}:${String(x).padStart(2, "0")} ${ap}`; };
const toHM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromHM = (s) => { const [h, m] = String(s).split(":").map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };
function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 2600); }
const ind = (i) => (i === "EXO" ? "Echo x Orbit" : i || "Signal");

/* ---------- logo + animated icon ---------- */
const logo = (cls = "") => `<div class="logo ${cls}"><div class="w"><b>F</b>LOWMTD</div><div class="s">Signals</div></div>`;
function ticks() { let t = ""; for (let a = 0; a < 360; a += 10) { const r = a % 30 === 0 ? 446 : 436, c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); t += `<line x1="${512 + 420 * c}" y1="${512 + 420 * s}" x2="${512 + r * c}" y2="${512 + r * s}" stroke="#58626f" stroke-width="${a % 30 === 0 ? 4 : 2.5}"/>`; } return t; }
function animIcon() {
  const B = "572,246 396,566 496,566 452,780 646,452 540,452", ring = "M862 512 A350 128 0 1 1 162 512 A350 128 0 1 1 862 512";
  return `<div class="icon-anim"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ig" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#0c121a"/><stop offset="1" stop-color="#020304"/></radialGradient><linearGradient id="ib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a2a"/><stop offset="1" stop-color="#e05a00"/></linearGradient><filter id="iff"><feGaussianBlur stdDeviation="12"/></filter></defs>
<rect width="1024" height="1024" fill="url(#ig)"/><circle cx="512" cy="512" r="420" fill="none" stroke="#1a2029" stroke-width="3"/>${ticks()}
<g class="sweep"><path d="M512 512 L932 512 A420 420 0 0 0 818 223 Z" fill="#9ccbff" opacity=".07"/></g>
<g fill="none" stroke="#9ccbff"><g transform="rotate(-28 512 512)"><ellipse cx="512" cy="512" rx="350" ry="128" stroke-width="6" opacity=".9"/><circle r="15" fill="#9ccbff"><animateMotion dur="13s" repeatCount="indefinite" path="${ring}"/></circle></g>
<g transform="rotate(32 512 512)"><ellipse cx="512" cy="512" rx="350" ry="128" stroke-width="3.5" opacity=".4"/><circle r="10" fill="#9ccbff" opacity=".7"><animateMotion dur="19s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="${ring}"/></circle></g></g>
<circle class="shock" cx="512" cy="512" r="10" fill="none" stroke="#ff8a2a" stroke-width="6" opacity="0"/>
<polygon class="bolt-glow" points="${B}" fill="#ff6a00" opacity=".2" filter="url(#iff)"/><polygon points="${B}" fill="url(#ib)"/><polygon class="bolt-core" points="${B}" fill="#fff" opacity="0"/></svg></div>`;
}

/* ---------- login ---------- */
function renderLogin(msg) {
  const fh = S.cfg && S.cfg.flowhub_url;
  $("#app").className = ""; $("#app").innerHTML = `<main class="login">${animIcon()}${logo()}<div style="height:14px"></div><p>Live trade signals for FLOWMTD members.</p>
  ${msg ? `<div class="err">${esc(msg)}</div>` : ""}
  ${fh ? `<a class="btn" href="${esc(fh.replace(/\/$/, ""))}/signals-login?return=${encodeURIComponent(location.origin)}">Connect your Discord</a>` : `<div class="err" style="max-width:300px">Open Signals from the link inside FlowHub to sign in.</div>`}
  <p class="mono" style="font-size:11px;color:var(--ink3)">Premium and Mentorship members only.</p>
  <button class="btn ghost small" data-act="theme">Light / dark</button></main>`;
}

/* ---------- boot ---------- */
async function boot() {
  applyTheme(ls("sg_theme") || "dark");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data && e.data.open) handleDeepLink(e.data.open); });
  try { S.cfg = await api("/config", { auth: false }); } catch { $("#app").innerHTML = `<main class="login"><p>Can't reach Signals right now. Check your connection and reopen the app.</p></main>`; return; }
  const q = new URLSearchParams(location.search), pass = q.get("pass");
  if (pass) {
    history.replaceState(null, "", "/");
    try { const r = await api("/auth/handoff", { method: "POST", auth: false, body: { pass, device_id: deviceId() } }); S.token = r.token; ls("sg_token", r.token); }
    catch (e) { return renderLogin(e.status === 403 ? "Signals is for Premium and Mentorship members. Your Discord role doesn't include access yet." : "That sign-in link expired. Open Signals again from FlowHub."); }
  }
  if (!S.token) return renderLogin();
  try { S.me = await api("/me"); } catch { return; }
  applyTheme(S.me.settings.theme || "dark", true);
  renderShell(); await loadFeed(); startPoll(); checkPushState(); ping();
  const sid = q.get("s"); if (sid) handleDeepLink("/?s=" + sid); else if (q.get("tab") === "outlook") handleDeepLink("/?tab=outlook"); else if (q.get("tab") === "rbx") handleDeepLink("/?tab=rbx");
}
function handleDeepLink(u) { if (/[?&]tab=rbx/.test(u) && S.me && S.me.member.role === "ADMIN") { S.tab = "rbx"; renderShell(); history.replaceState(null, "", "/"); return; } if (/[?&]tab=outlook/.test(u)) { S.tab = "outlook"; renderShell(); return; } const m = /[?&]s=(\d+)/.exec(u); if (!m) return; S.tab = "signals"; renderShell(); setTimeout(() => { const el = document.querySelector(`[data-id="${m[1]}"]`); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("hl"); setTimeout(() => el.classList.remove("hl"), 4000); } }, 150); history.replaceState(null, "", "/"); }
function startPoll() { clearInterval(S.poll); S.poll = setInterval(() => { if (document.visibilityState === "visible" && S.tab === "signals") loadFeed(); }, 5000); document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.me) loadFeed(); }); }

/* ---------- presence (lets coaches see who is online / watching; members are told in Settings) ---------- */
function ping() { if (!S.me) return; api("/presence", { method: "POST", body: { visible: document.visibilityState === "visible", tab: S.tab } }).catch(() => {}); }
setInterval(ping, 30000); document.addEventListener("visibilitychange", ping);

/* ---------- theme ---------- */
function applyTheme(t, fromServer) {
  const eff = t === "auto" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.dataset.theme = eff; ls("sg_theme", t);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = eff === "light" ? "#eef1f5" : "#030405";
}

/* ---------- shell ---------- */
const ICON = { rbx: '<path d="M4 19V5M4 19h16"/><path d="M8 15l3-4 3 2 5-6"/>', signals: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', outlook: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', admin: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>' };
function tabsHtml() {
  const t = [["signals", "Signals"], ["outlook", "Outlook"], ["stats", "Stats"], ["settings", "Settings"]]; if (S.me && (S.me.member.role === "ADMIN" || S.me.member.role === "COACH")) t.push(["admin", "Admin"]); if (S.me && S.me.member.role === "ADMIN") t.push(["rbx", "RBX"]);
  return `<nav class="tabs">${t.map(([k, l]) => `<button class="tab ${S.tab === k ? "on" : ""}" data-act="tab" data-v="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>${l}</button>`).join("")}</nav>`;
}
function renderShell() {
  const m = S.me.member, paused = S.cfg && S.cfg.paused;
  $("#app").className = "shell";
  $("#app").innerHTML = `<aside class="side">${logo("")}<div style="height:6px"></div>${tabsHtml()}<div class="who">${esc(m.name)}<br>${esc(m.tier === "staff" ? m.role : m.tier)}</div></aside>
  <div class="mainc"><header class="top">${logo("sm")}<span class="st ${paused ? "off" : ""}"><span class="dot"></span>${paused ? "PAUSED" : "LIVE"}</span></header><main class="wrap" id="view"></main></div>
  <div class="mobtabs">${tabsHtml()}</div>`;
  renderView();
}
function renderView() {
  const v = $("#view"); if (!v) return;
  if (S.tab === "signals") v.innerHTML = feedHtml();
  else if (S.tab === "outlook") { v.innerHTML = `<h2>Today's outlook</h2><div class="box outlook" id="ol">Loading...</div>`; loadOutlook(); }
  else if (S.tab === "stats") { v.innerHTML = `<h2>Weekly results</h2><div id="st">Loading...</div>`; loadStats(); }
  else if (S.tab === "settings") v.innerHTML = settingsHtml();
  else if (S.tab === "rbx" && S.me && S.me.member.role === "ADMIN") { v.innerHTML = `<h2>RBX</h2><div id="rbx">Loading...</div>`; try { loadRbx(); } catch { /* never affects the rest of the app */ } }
  else if (S.tab === "admin") { v.innerHTML = `<h2>Admin</h2><div id="ad">Loading...</div>`; loadAdmin(); }
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.v === S.tab));
}

/* ---------- signals feed ---------- */
async function loadFeed() {
  try { const r = await api("/feed?limit=80"), sig = r.rows.map((x) => [x.id, x.status, x.result, x.verdict, x.kind].join(":")).join("|"); if (sig === S.sig) return; S.sig = sig; S.rows = r.rows; if (S.tab === "signals" && $("#view")) $("#view").innerHTML = feedHtml(); } catch { /* signedOut handled */ }
}
function resolved(r) { return S.rows.some((x) => x.id > r.id && x.indicator === r.indicator && (x.kind === "nlw" || (x.kind === "entry" && x.direction === r.direction))); }
function feedHtml() {
  const f = S.filter, rows = S.rows.filter((r) => {
    if (r.kind === "watching" && resolved(r)) return false;
    if (r.kind === "be" && r.parent_id && S.rows.some((x) => x.id === r.parent_id)) return false;
    if (f === "EXO" || f === "INVERTIX") return r.indicator === f;
    if (f === "long") return r.direction === "LONG"; if (f === "short") return r.direction === "SHORT"; return true;
  });
  const chips = [["all", "All"], ["EXO", "Echo x Orbit"], ["INVERTIX", "INVERTIX"], ["long", "Long"], ["short", "Short"]].map(([k, l]) => `<button class="f ${f === k ? "on" : ""}" data-act="filter" data-v="${k}">${l}</button>`).join("");
  let out = `<h2>Signals</h2><div class="chips">${chips}</div>`;
  const live = S.rows.some((r) => r.kind === "entry" && !r.result && r.status !== "ended" && Date.now() - new Date(r.received_at).getTime() < 4 * 3600 * 1000);
  if (!live) out += `<div class="none">No active trades</div>`;
  if (!rows.length) return out + `<div class="empty">No signals yet. They appear here the moment they fire.</div>`;
  out += `<div class="grid">`; let last = "";
  for (const r of rows) { const d = dayLabel(r.received_at); if (d !== last) { out += `<div class="day">${d}</div>`; last = d; } out += card(r); }
  return out + `</div>`;
}
function card(r) {
  const t = fT.format(new Date(r.received_at)), dirCls = r.direction === "SHORT" ? "S" : "L", head = `<div class="h"><span class="sym">${esc(r.symbol || "NQ")} · ${esc(ind(r.indicator))}</span><span class="tm">${t}</span></div>`;
  if (r.kind === "entry") {
    const be = S.rows.find((x) => x.kind === "be" && x.parent_id === r.id);
    let st = `<span class="chip c-act">Active trade</span>`;
    if (r.result) { const m = { target: ["c-win", "Target reached"], be: ["c-win", "Break-even"], stopped: ["c-loss", "Stopped out"], manual: ["c-act", "Closed"] }[r.result]; st = `<span class="chip ${m[0]}">Ended · ${m[1]}</span>`; }
    else if (be) st = `<span class="chip c-be">Move stop to break-even</span>`;
    const v = r.verdict ? `<span class="chip c-${r.verdict.toLowerCase()}">Reviewer · ${r.verdict[0] + r.verdict.slice(1).toLowerCase()}</span>` : "";
    const op = r.opinion ? (S.open.has(r.id) ? `<div class="note">${esc(r.opinion)}</div><button class="more" data-act="more" data-v="${r.id}">Hide comment</button>` : `<button class="more" data-act="more" data-v="${r.id}">Reviewer comment</button>`) : "";
    return `<article class="card ${r.direction === "SHORT" ? "short" : ""}" data-id="${r.id}">${head}<div class="dir"><span class="${dirCls}">${r.direction}</span><b>${px(r.entry_px)}</b></div>
    <div class="lv"><div><i>Stop</i><b>${px(r.stop_px)}</b></div><div><i>Profit</i><b>${px(r.profit_px)}</b></div><div><i>Target</i><b>${px(r.target_px)}</b></div></div><div class="cc">${st}${v}</div>${op}</article>`;
  }
  if (r.kind === "watching") return `<article class="card watch" data-id="${r.id}">${head}<div class="dir"><span class="W">WATCHING FOR ${r.direction === "SHORT" ? "SHORTS" : "LONGS"}</span></div><div class="cc"><span class="chip c-watch">Watching</span></div><div class="note">Not an entry yet. Wait for the confirmed signal.</div></article>`;
  if (r.kind === "be") return `<article class="card" data-id="${r.id}">${head}<div class="dir"><span class="A">MOVE STOP TO BREAK-EVEN</span></div><div class="cc"><span class="chip c-be">Break-even</span></div></article>`;
  if (r.kind === "late") return `<article class="card late" data-id="${r.id}">${head}<div class="dir"><span class="A">TOO LATE TO ENTER</span></div><div class="cc"><span class="chip c-late">Too late to enter</span></div><div class="note">${esc(String(r.detail || "").split("\n")[0])}</div></article>`;
  const why = String(r.detail || "").replace(/^Reason:\s*/i, "").split("\n")[0];
  return `<article class="card mute" data-id="${r.id}">${head}<div class="dir"><span style="color:var(--ink2);font-size:18px">NO LONGER WATCHING</span></div><div class="note">${esc(why)}</div></article>`;
}

/* ---------- outlook / stats ---------- */
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
async function loadOutlook() {
  try { const r = await api("/outlook"), e = r.embed, el = $("#ol"); if (!el) return;
    if (!e) { el.textContent = "The outlook posts every weekday at 9:00 AM New York time."; return; }
    el.innerHTML = `<div class="mono" style="color:var(--ink3);font-size:12px">${esc(e.title || "")}</div><p>${md(e.description || "")}</p>` + (e.fields || []).map((f) => `<h3>${esc(f.name)}</h3><p>${md(f.value)}</p>`).join("") + `<p style="margin-top:16px;color:var(--ink3);font-size:13px">${esc(e.footer?.text || "")}</p>`;
  } catch { /* handled */ }
}
async function loadStats() {
  try { const r = await api("/stats"), el = $("#st"); if (!el) return;
    const t = r.total;
    el.innerHTML = `<div class="kpi"><div><i>Wins (12 wks)</i><b style="color:var(--win)">${t.wins}</b></div><div><i>Losses</i><b style="color:var(--loss)">${t.losses}</b></div><div><i>Win rate</i><b>${t.rate == null ? "-" : t.rate + "%"}</b></div></div>
    <div class="box bars">${r.weeks.length ? r.weeks.map((w) => { const tot = Math.max(1, w.signals); return `<div class="bar"><span>${w.week.slice(5)}</span><div class="t"><i class="w" style="width:${100 * w.wins / tot}%"></i><i class="l" style="width:${100 * w.losses / tot}%"></i><i class="p" style="width:${100 * w.pending / tot}%"></i></div><span>${w.rate == null ? "-" : w.rate + "%"}</span></div>`; }).join("") : "<div class='empty'>No results yet.</div>"}</div>
    <p style="color:var(--ink3);font-size:13px;line-height:1.4">${esc(r.note)} Grey = results not entered yet. Weeks start on Monday (New York time).</p>`;
  } catch { /* handled */ }
}

/* ---------- settings ---------- */
const tg = (on, k, v) => `<button class="tg ${on ? "on" : ""}" data-act="tg" data-k="${k}" data-v="${v}" aria-pressed="${on}"></button>`;
function isStandalone() { return navigator.standalone === true || matchMedia("(display-mode: standalone)").matches; }
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function checkPushState() {
  const sup = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (isIOS() && !isStandalone()) S.push = { state: "install" }; else if (!sup) S.push = { state: "unsupported" }; else if (Notification.permission === "denied") S.push = { state: "denied" };
  else if (Notification.permission === "granted") { S.push = { state: "granted" }; navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((sub) => { S.push.on = !!sub; if (S.tab === "settings") renderView(); }).catch(() => {}); } else S.push = { state: "ask" };
}
function pushBox() {
  const p = S.push.state;
  if (p === "install") return `<div class="box warn"><b>Add Signals to your Home Screen first</b><ol class="steps"><li>Open this page in <b>Safari</b> and tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</li><li>Open <b>Signals</b> from your Home Screen and come back to this screen.</li><li>Tap <b>Turn on notifications</b>.</li></ol></div>`;
  if (p === "unsupported") return `<div class="box warn">This browser can't receive push notifications. Use Safari on iPhone (iOS 16.4 or newer, added to the Home Screen) or Chrome on Android or laptop.</div>`;
  if (p === "denied") return `<div class="box warn">Notifications are blocked for Signals. Turn them back on in your phone's Settings, under Notifications, then Signals.</div>`;
  const on = S.push.state === "granted" && S.push.on;
  return `<div class="box"><div class="inl"><b>${on ? "Notifications are on for this device" : "Notifications are off"}</b></div><p style="color:var(--ink2);margin:6px 0 12px;font-size:14px">Signals works on one device at a time. Turning this on here switches your alerts to this device.</p><div class="inl">${on ? `<button class="btn small" data-act="pushtest">Send me a test alert</button><button class="btn ghost small" data-act="pushoff">Turn off</button>` : `<button class="btn" data-act="pushon">Turn on notifications</button>`}</div></div>`;
}
function settingsHtml() {
  const s = S.me.settings, m = S.me.member, wins = (S.cfg.sessions || []), qOn = s.quiet_start != null && s.quiet_end != null, paused = s.paused_until && new Date(s.paused_until) > new Date();
  const row = (t, sub, k, v, on) => `<div class="row"><div>${t}${sub ? `<small>${sub}</small>` : ""}</div>${tg(on, k, v)}</div>`;
  return `<h2>Settings</h2>${pushBox()}
  <div class="sec">Alert me about</div><div class="panel">${row("Watching", "A setup is forming. Not an entry.", "types", "watching", s.types.watching)}${row("Entry", "A confirmed signal", "types", "entry", s.types.entry)}${row("Move stop to break-even", "", "types", "be", s.types.be)}${row("No longer watching", "A watch that ended, with the reason", "types", "nlw", s.types.nlw)}${row("Morning outlook", "A notification when the 9:00 AM outlook is ready", "types", "outlook", s.types.outlook !== false)}</div>
  <div class="sec">Indicators and direction</div><div class="panel">${row("Echo x Orbit", "", "indicators", "EXO", s.indicators.EXO)}${row("INVERTIX", "", "indicators", "INVERTIX", s.indicators.INVERTIX)}<div class="row"><div>Direction</div><div class="seg">${["both", "long", "short"].map((d) => `<button class="${s.direction === d ? "on" : ""}" data-act="dir" data-v="${d}">${d}</button>`).join("")}</div></div></div>
  <div class="sec">Sessions (New York time)</div><div class="panel">${wins.map((w) => row(esc(w.label), w.enabled ? `${mm(w.start_min)} to ${mm(w.end_min)}` : "Switched off by FLOWMTD", "sessions", w.key, s.sessions[w.key] !== false)).join("")}</div>
  <div class="sec">Quiet hours (New York time)</div><div class="panel"><div class="row"><div>Mute alerts overnight<small>Signals still appear in the app</small></div>${tg(qOn, "quiet", "on")}</div>${qOn ? `<div class="row"><div class="inl"><input type="time" id="qs" value="${toHM(s.quiet_start)}"> to <input type="time" id="qe" value="${toHM(s.quiet_end)}"></div><button class="btn small" data-act="quietsave">Save</button></div>` : ""}<div class="row"><div>${paused ? "Alerts are paused" : "Pause all alerts"}<small>${paused ? "Until " + new Date(s.paused_until).toLocaleString("en-US", { timeZone: ET, weekday: "short", hour: "numeric", minute: "2-digit" }) : "For the next 12 hours"}</small></div><button class="btn small ${paused ? "" : "ghost"}" data-act="${paused ? "resume" : "pause"}">${paused ? "Resume" : "Pause"}</button></div></div>
  <div class="sec">Appearance</div><div class="panel"><div class="row"><div>Theme</div><div class="seg">${["dark", "light", "auto"].map((d) => `<button class="${(ls("sg_theme") || "dark") === d ? "on" : ""}" data-act="theme2" data-v="${d}">${d}</button>`).join("")}</div></div></div>
  <div class="sec">Account</div><div class="panel"><div class="row"><div>${esc(m.name)}<small>${esc(m.tier === "staff" ? m.role : m.tier)}</small></div><button class="btn ghost small" data-act="logout">Sign out</button></div></div>
  <p style="color:var(--ink3);font-size:12px;line-height:1.5;margin-top:14px">Signals are information for your own decisions, not financial advice. Trading futures involves risk of loss. Manage your own risk.</p><p style="color:var(--ink3);font-size:12px;line-height:1.5;margin-top:8px">FLOWMTD coaches can see when you are online in Signals and whether you have alerts turned on. They cannot see anything else on your device.</p>`;
}
function saveSettings(patch) {
  Object.assign(S.me.settings, patch); clearTimeout(S.saveT);
  S.saveT = setTimeout(() => api("/settings", { method: "PUT", body: S.me.settings }).then((r) => { S.me.settings = r.settings; }).catch(() => toast("Could not save. Try again.")), 350);
}
const b64 = (s) => { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
async function pushOn() {
  try {
    if (!S.cfg.vapid_public) return toast("Notifications aren't ready yet.");
    const perm = await Notification.requestPermission(); if (perm !== "granted") { checkPushState(); return renderView(); }
    const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(S.cfg.vapid_public) });
    await api("/push/subscribe", { method: "POST", body: { subscription: sub.toJSON(), label: (isIOS() ? "iPhone" : /android/i.test(navigator.userAgent) ? "Android" : "Computer") } });
    S.push = { state: "granted", on: true }; renderView(); toast("Notifications are on. Send yourself a test alert.");
  } catch (e) { toast("Could not turn on notifications."); }
}
async function pushOff() { try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { await api("/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); } S.push.on = false; renderView(); } catch { toast("Could not turn off."); } }

/* ---------- admin ---------- */
async function liveHtml() {
    const pr = await api("/admin/presence"), dotc = { watching: "var(--win)", in_app: "var(--ice)", background: "var(--amber)", offline: "var(--ink3)" }, lbl = { watching: "Watching signals", in_app: "In the app", background: "Open in background", offline: "Offline" };
    const ago = (t) => { if (!t) return "never"; const m = Math.round((Date.now() - Date.parse(t)) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
    return `<div class="sec">Live now (updates every 15 seconds)</div><div class="kpi"><div><i>Watching</i><b style="color:var(--win)">${pr.counts.watching}</b></div><div><i>Online</i><b>${pr.counts.online}</b></div><div><i>Alerts on</i><b>${pr.counts.push} / ${pr.counts.total}</b></div></div><div class="panel" id="live">${pr.members.map((x) => `<div class="row"><div><span class="dot" style="background:${dotc[x.status]};display:inline-block;margin-right:8px"></span><b>${esc(x.name)}${x.me ? " (you)" : ""}</b><small>${lbl[x.status]}${x.tab ? " · " + esc(x.tab) : ""} · ${x.status === "offline" ? "last seen " + ago(x.last_seen) : "active now"} · ${x.push ? "alerts on" : "alerts off"}</small></div><span class="chip">${esc(x.tier === "staff" ? x.role : x.tier || "")}</span></div>`).join("") || "<div class='empty'>Nobody has signed in yet.</div>"}</div>`;
}
async function loadAdmin() {
  const el = $("#ad"); if (!el) return; const admin = S.me.member.role === "ADMIN";
  try {
    const live = `<div id="livewrap">${await liveHtml()}</div>`;
    const ses = await api("/admin/sessions"); S.admin.sessions = ses.sessions;
    let h = live + `<div class="sec">Session times (New York time). Changes apply to everyone.</div><div class="panel">${ses.sessions.map((w) => `<div class="row" data-key="${w.key}"><div><b>${esc(w.label)}</b></div><div class="inl"><input type="time" class="ss" value="${toHM(w.start_min)}"> to <input type="time" class="se" value="${toHM(w.end_min)}">${tg(w.enabled, "winon", w.key)}</div></div>`).join("")}<div class="row"><span></span><button class="btn small" data-act="savewin">Save session times</button></div></div>`;
    if (admin) {
      const sg = await api("/admin/signals"), mem = await api("/admin/members"); S.admin.signals = sg.rows;
      h += `<div class="sec">Enter results (entries only)</div><div class="panel">${sg.rows.filter((r) => r.kind === "entry").slice(0, 25).map((r) => `<div class="row" data-rid="${r.id}"><div><b>${esc(ind(r.indicator))} ${r.direction} ${px(r.entry_px)}</b><small>${dayLabel(r.received_at)} ${fT.format(new Date(r.received_at))}</small></div><div class="inl"><select class="rs"><option value="">Not entered</option>${["target", "stopped", "be", "manual"].map((o) => `<option value="${o}" ${r.result === o ? "selected" : ""}>${{ target: "Target", stopped: "Stopped", be: "Break-even", manual: "Closed manually" }[o]}</option>`).join("")}</select><input class="rp" type="number" step="0.25" placeholder="pts" style="width:76px" value="${r.result_pts ?? ""}"><button class="btn small" data-act="saveres">Save</button></div></div>`).join("") || "<div class='empty'>No entries yet.</div>"}</div>`;
      h += `<div class="sec">Members</div><div class="panel"><table><tr><th>Name</th><th>Access</th><th>Alerts</th></tr>${mem.members.filter((x) => x.role !== "REVOKED").map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.tier || x.role)}</td><td>${x.devices_on ? "on" : "off"}</td></tr>`).join("") || "<tr><td colspan=3>No members yet.</td></tr>"}</table></div>`;
    }
    el.innerHTML = h;
  } catch { /* handled */ }
}

setInterval(async () => { const w = $("#livewrap"); if (S.tab === "admin" && w && S.me && document.visibilityState === "visible") { try { w.innerHTML = await liveHtml(); } catch { /* handled */ } } }, 15000);

/* ---------- events ---------- */
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
  if (a === "tab") { S.tab = v; renderView(); window.scrollTo(0, 0); if (v === "signals") loadFeed(); ping(); }
  else if (a === "filter") { S.filter = v; $("#view").innerHTML = feedHtml(); }
  else if (a === "more") { const id = Number(v); S.open.has(id) ? S.open.delete(id) : S.open.add(id); $("#view").innerHTML = feedHtml(); }
  else if (a === "theme") { applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"); }
  else if (a === "theme2") { applyTheme(v); saveSettings({ theme: v }); renderView(); }
  else if (a === "tg") {
    const k = b.dataset.k, s = S.me.settings;
    if (k === "quiet") { s.quiet_start == null ? saveSettings({ quiet_start: 22 * 60, quiet_end: 6 * 60 }) : saveSettings({ quiet_start: null, quiet_end: null }); }
    else if (k === "winon") { b.classList.toggle("on"); }
    else { const cur = { ...s[k] }; cur[v] = !(cur[v] !== false); saveSettings({ [k]: cur }); }
    if (k !== "winon") renderView();
  }
  else if (a === "dir") { saveSettings({ direction: v }); renderView(); }
  else if (a === "quietsave") { const qs = fromHM($("#qs").value), qe = fromHM($("#qe").value); saveSettings({ quiet_start: qs, quiet_end: qe }); toast("Quiet hours saved"); }
  else if (a === "pause") { saveSettings({ paused_until: new Date(Date.now() + 12 * 3600e3).toISOString() }); renderView(); }
  else if (a === "resume") { saveSettings({ paused_until: null }); renderView(); }
  else if (a === "pushon") await pushOn();
  else if (a === "pushoff") await pushOff();
  else if (a === "pushtest") { try { const r = await api("/push/test", { method: "POST", body: {} }); toast(r.sent ? "Test alert sent" : "No device received it. Turn notifications off and on again."); } catch { toast("Could not send the test."); } }
  else if (a === "logout") { try { await pushOff(); } catch { /* ignore */ } signedOut(""); }
  else if (a === "savewin") {
    const sessions = [...document.querySelectorAll("[data-key]")].map((r) => ({ key: r.dataset.key, start_min: fromHM($(".ss", r).value), end_min: fromHM($(".se", r).value), enabled: $(".tg", r).classList.contains("on") }));
    try { await api("/admin/sessions", { method: "PUT", body: { sessions } }); S.cfg = await api("/config", { auth: false }); toast("Session times saved"); } catch { toast("Could not save session times."); }
  }
  else if (a === "saveres") { const r = b.closest("[data-rid]"); try { await api("/admin/result", { method: "PUT", body: { id: Number(r.dataset.rid), result: $(".rs", r).value || null, pts: $(".rp", r).value } }); toast("Result saved"); S.sig = ""; loadFeed(); } catch { toast("Could not save the result."); } }
});
matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => { if ((ls("sg_theme") || "dark") === "auto") applyTheme("auto"); });
boot();


/* ---------- RBX (admin only). Data comes from rbx-api, which returns 403 to anyone who is not an ADMIN. ---------- */
async function rbxApi(path, o = {}) {
  const r = await fetch(RBX_API + path, { method: o.method || "GET", headers: { "Content-Type": "application/json", Authorization: "Bearer " + S.token }, body: o.body ? JSON.stringify(o.body) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "error"), { status: r.status });
  return j;
}
const RBX_V = { TAKE: ["c-take", "Good entry"], CAUTION: ["c-caution", "Okay entry"], SKIP: ["c-skip", "Bad entry"] };
const rbxWhen = (t) => new Date(t).toLocaleString("en-US", { timeZone: ET, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
function rbxTally(list, title) {
  if (!list || !list.length) return "";
  return `<div class="sec">${esc(title)}</div><div class="panel">${list.map((t) => `<div class="row"><div>${esc(t.key)}<small>${t.n} signal${t.n === 1 ? "" : "s"} · ${t.pending} open</small></div><div style="text-align:right"><b>${t.rate == null ? "-" : t.rate + "%"}</b><small>${t.target} target · ${t.be} BE · ${t.stopped} stopped</small></div></div>`).join("")}</div>`;
}
function rbxCard(r) {
  const v = RBX_V[r.verdict] || ["", "Reviewing..."], long = r.dir === "LONG";
  const res = r.result ? { target: ["c-win", "Target"], be: ["c-win", "Break-even"], stopped: ["c-loss", "Stopped"], manual: ["c-act", "Closed"] }[r.result] : null;
  const g = r.ctx && r.ctx.gap && r.ctx.gap !== "none" ? ` · ${esc(r.ctx.gap)} gap` : "";
  return `<div class="card ${long ? "" : "short"}" data-rid="${r.id}" data-e="${esc(r.entry)}" data-s="${esc(r.stop)}" data-t="${esc(r.target)}">
    <div class="h"><div><b>${long ? "LONG" : "SHORT"} ${esc(r.entry)}</b> <span class="chip">${esc(r.grade)}</span> <span class="chip ${v[0]}">${v[1]}</span>${r.checks ? ` <span class="chip">${esc(r.checks)}</span>` : ""}</div><small>${rbxWhen(r.received_at)} ET</small></div>
    <div class="note">Stop ${esc(r.stop)} · Target ${esc(r.target)}${g}</div>
    ${(r.reasons || []).map((x) => `<div class="note" style="color:var(--amber)">⚠ ${esc(x)}</div>`).join("")}
    ${(r.notes || []).slice(0, 4).map((x) => `<div class="note">• ${esc(x)}</div>`).join("")}
    ${r.opinion ? `<div class="note" style="color:var(--ink)">${r.ai ? "Claude: " : ""}${esc(r.opinion)}</div>` : ""}
    <div class="row" style="padding:10px 0 0"><span>${res ? `<span class="chip ${res[0]}">${res[1]}${r.result_pts != null ? " " + (Number(r.result_pts) > 0 ? "+" : "") + Math.round(Number(r.result_pts)) + " pts" : ""}</span>` : '<span class="chip">Open</span>'}</span>
      <span><select class="rs" style="background:var(--panel);color:var(--ink);border:1px solid var(--line2);padding:8px"><option value="">Open</option><option value="target">Target</option><option value="be">Break-even</option><option value="stopped">Stopped</option></select> <button class="btn ghost small" data-act="rbxsave">Save</button></span></div></div>`;
}
async function loadRbx() {
  const el = $("#rbx"); if (!el) return;
  if (!S.rbxPoll) S.rbxPoll = setInterval(() => { try { const a = document.activeElement; if (S.tab === "rbx" && document.visibilityState === "visible" && !(a && a.closest && a.closest("#rbx"))) loadRbx(); } catch { /* ignore */ } }, 20000);
  try {
    const d = await rbxApi("/list");
    el.innerHTML = `<div class="note" style="margin:0 4px 12px">Private to admins. Each RBX alert is checked against the playbook and scored, then pushed to your phone. Wins = target hit; only a stop counts as a loss.</div>${rbxTally(d.byVerdict, "Results by verdict")}${rbxTally(d.byGrade, "Results by grade")}<div class="sec">Latest signals</div>${d.rows.length ? d.rows.map(rbxCard).join("") : '<div class="empty">No RBX signals yet. They appear here when the RBX alert fires.</div>'}`;
  } catch (e) { el.innerHTML = `<div class="empty">${e.status === 403 ? "RBX is for admins only." : "Could not load RBX reviews. Try again in a moment."}</div>`; }
}
document.addEventListener("click", async (ev) => {
  const b = ev.target && ev.target.closest ? ev.target.closest('[data-act="rbxsave"]') : null; if (!b) return;
  const c = b.closest("[data-rid]"), sel = c && c.querySelector(".rs"); if (!c || !sel) return;
  const e = Number(c.dataset.e), st = Number(c.dataset.s), tg = Number(c.dataset.t), r = sel.value || null;
  const pts = r === "target" ? Math.abs(tg - e) : r === "stopped" ? -Math.abs(e - st) : r === "be" ? 0 : null;
  try { b.disabled = true; await rbxApi("/result", { method: "PUT", body: { id: Number(c.dataset.rid), result: r, pts } }); await loadRbx(); } catch { b.disabled = false; }
});
