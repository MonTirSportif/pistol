/* Mon lecteur SCATT – MonTirSportif. Lit les fichiers .scatt dans le navigateur (rien n'est envoyé). */
// Lecture des anciens fichiers SCATT (.scatt) : conteneur OLE + flux "Contents".
// Format reconstitué à partir de séances réelles, vérifié contre des rapports SCATT Expert.
const SCATT = (() => {
  const GUID_TRACE = [0x94,0x37,0xa3,0x5f,0x43,0xe9,0xd3,0x11,0xbd,0xf4,0x00,0x80,0x48,0x9e,0x46,0x1b];
  const GUID_HEAD  = [0x92,0x37,0xa3,0x5f,0x43,0xe9,0xd3,0x11,0xbd,0xf4,0x00,0x80,0x48,0x9e,0x46,0x1b];

  // ---------- Conteneur OLE (Compound File Binary) ----------
  function readCFB(buf) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const sig = [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1];
    for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error("Ce fichier n'est pas un fichier SCATT (.scatt) de l'ancien format.");
    const ssz = 1 << dv.getUint16(0x1e, true), mssz = 1 << dv.getUint16(0x20, true);
    const dirStart = dv.getUint32(0x30, true), cutoff = dv.getUint32(0x38, true);
    const miniFatStart = dv.getUint32(0x3c, true), difatStart = dv.getUint32(0x44, true);
    const off = id => (id + 1) * ssz;
    const fatSectors = [];
    for (let i = 0; i < 109; i++) { const s = dv.getUint32(0x4c + 4 * i, true); if (s < 0xfffffffa) fatSectors.push(s); }
    let ds = difatStart;
    while (ds < 0xfffffffa) {
      for (let i = 0; i < ssz / 4 - 1; i++) { const s = dv.getUint32(off(ds) + 4 * i, true); if (s < 0xfffffffa) fatSectors.push(s); }
      ds = dv.getUint32(off(ds) + ssz - 4, true);
    }
    const fat = [];
    for (const s of fatSectors) for (let i = 0; i < ssz / 4; i++) fat.push(dv.getUint32(off(s) + 4 * i, true));
    const chain = (start, table) => { const out = []; let s = start, guard = 0; while (s < 0xfffffffa && guard++ < 1e6) { out.push(s); s = table[s]; } return out; };
    const readChain = (start, size) => {
      const secs = chain(start, fat), out = new Uint8Array(secs.length * ssz);
      secs.forEach((s, i) => out.set(buf.subarray(off(s), off(s) + ssz), i * ssz));
      return size == null ? out : out.subarray(0, size);
    };
    const dir = readChain(dirStart);
    const ddv = new DataView(dir.buffer);
    const entries = [];
    for (let p = 0; p + 128 <= dir.length; p += 128) {
      const nlen = ddv.getUint16(p + 0x40, true);
      let name = ""; for (let i = 0; i < nlen / 2 - 1; i++) name += String.fromCharCode(ddv.getUint16(p + 2 * i, true));
      entries.push({ name, type: dir[p + 0x42], start: ddv.getUint32(p + 0x74, true), size: ddv.getUint32(p + 0x78, true) });
    }
    const root = entries[0];
    const ent = entries.find(e => e.name === "Contents" && e.type === 2);
    if (!ent) throw new Error("Flux « Contents » introuvable : ce n'est pas une séance SCATT.");
    if (ent.size >= cutoff) return readChain(ent.start, ent.size);
    const mini = readChain(root.start, root.size);
    const mfRaw = readChain(miniFatStart), mfdv = new DataView(mfRaw.buffer), minifat = [];
    for (let i = 0; i < mfRaw.length / 4; i++) minifat.push(mfdv.getUint32(4 * i, true));
    const secs = chain(ent.start, minifat), out = new Uint8Array(secs.length * mssz);
    secs.forEach((s, i) => out.set(mini.subarray(s * mssz, (s + 1) * mssz), i * mssz));
    return out.subarray(0, ent.size);
  }

  // ---------- Flux de mesures compressé ----------
  function runs(d, dv, p) {
    const v = [];
    for (;;) {
      const c = d[p];
      if (c === 0x11) { const k = d[p + 1]; for (let i = 0; i < k; i++) v.push(dv.getInt8(p + 2 + i)); p += 2 + k; }
      else if (c === 0x12) { const n = d[p + 1]; for (let i = 0; i < n; i++) v.push(dv.getInt16(p + 2 + 2 * i, true)); p += 2 + 2 * n; }
      else if (c === 0x13) { const n = d[p + 1]; for (let i = 0; i < n; i++) v.push(dv.getInt32(p + 2 + 4 * i, true)); p += 2 + 4 * n; }
      else if (c === 0x21) { const k = dv.getUint16(p + 1, true); for (let i = 0; i < k; i++) v.push(dv.getInt8(p + 3 + i)); p += 3 + k; }
      else if (c === 0x22) { const n = dv.getUint16(p + 1, true); for (let i = 0; i < n; i++) v.push(dv.getInt16(p + 3 + 2 * i, true)); p += 3 + 2 * n; }
      else if (c === 0x23) { const n = dv.getUint16(p + 1, true); for (let i = 0; i < n; i++) v.push(dv.getInt32(p + 3 + 4 * i, true)); p += 3 + 4 * n; }
      else return [v, p];
    }
  }
  const find = (d, pat, from = 0, to = d.length) => {
    const out = [];
    outer: for (let i = from; i <= to - pat.length; i++) { for (let j = 0; j < pat.length; j++) if (d[i + j] !== pat[j]) continue outer; out.push(i); }
    return out;
  };
  const utf16 = (d, p, nbytes) => { let s = ""; for (let i = 0; i + 1 < nbytes; i += 2) { const c = d[p + i] | (d[p + i + 1] << 8); if (!c) break; s += String.fromCharCode(c); } return s; };
  const oleDate = v => new Date(Date.UTC(1899, 11, 30) + v * 864e5); // heure locale de l'enregistrement, lue en UTC

  function decode(buf) {
    const d = readCFB(buf), dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    const nameLen = dv.getUint32(4, true);
    const name = utf16(d, 8, nameLen);
    const traces = find(d, GUID_TRACE), heads = find(d, GUID_HEAD);
    const shots = [];
    let prevEnd = 0, meta = null;
    for (const L of traces) {
      const h = heads.filter(x => x < L && x >= prevEnd).pop();
      let info = {};
      if (h != null) {
        const sl = dv.getUint32(h + 20, true), q = h + 24 + sl;
        info = { code: utf16(d, h + 24, sl), time: oleDate(dv.getFloat64(q, true)), rate: dv.getUint32(q + 16, true), br: dv.getUint32(q + 20, true), match: d[q + 24] === 1 };
        if (!meta) meta = info;
      }
      const n = dv.getUint32(L + 24, true);
      const [v, p] = runs(d, dv, L + 29);
      if (v.length !== 2 * n) throw new Error(`Coup ${shots.length + 1} : données de trace incomplètes (${v.length}/${2 * n}).`);
      const vx = v.slice(0, n), vy = v.slice(n);
      for (const vv of [vx, vy]) // 2e valeur parfois enregistrée en position absolue (arme levée hors champ)
        if (n > 1 && Math.abs(vv[0]) > 20000 && Math.abs(vv[1]) > 20000 && Math.abs(vv[1] - vv[0]) < Math.abs(vv[0]) / 2) vv[1] -= vv[0];
      const x = new Float64Array(n), y = new Float64Array(n);
      let ax = 0, ay = 0;
      for (let i = 0; i < n; i++) { ax += vx[i]; ay += vy[i]; x[i] = ax / 100; y[i] = ay / 100; } // 0,01 mm -> mm
      shots.push({ n, x, y, deleted: d[p + 29] === 1, index: dv.getUint32(p + 30, true), time: oleDate(dv.getFloat64(p + 34, true)), ...info });
      prevEnd = p;
    }
    let comment = "";
    const cm = find(d, [0x5f,0,0x63,0,0x6f,0,0x6d,0,0x6d,0,0x65,0,0x6e,0,0x74,0,0x73,0], prevEnd);
    if (cm.length) { const q = cm[0] + 20; const l = dv.getUint32(q + 2, true); comment = utf16(d, q + 6, l); }
    return { name, comment, ...(meta || {}), shots };
  }

  // ---------- Cibles ISSF (mm) ----------
  const TARGETS = {
    AP10:  { label: "Pistolet 10 m",                 r10: 5.75, w: 8,   cal: 4.5, black: 7, dist: 10 },
    AR10:  { label: "Carabine 10 m",                 r10: 0.25, w: 2.5, cal: 4.5, black: 4, dist: 10 },
    SBP50: { label: "Pistolet 50 m / précision 25 m", r10: 25,   w: 25,  cal: 5.6, black: 7, dist: 50 },
    SBR50: { label: "Carabine 50 m",                 r10: 5.2,  w: 8,   cal: 5.6, black: 3, dist: 50 },
  };
  const target = code => TARGETS[code] || Object.assign({ unknown: true }, TARGETS.AP10, { label: `Discipline ${code || "inconnue"}` });

  // Valeur décimale estimée (troncature au dixième, 10,9 au maximum)
  function scoreAt(r, t) {
    const s = 10 + (t.r10 + t.cal / 2 - r) / t.w;
    if (s < 1) return 0;
    return Math.min(10.9, Math.floor(s * 10 + 1e-9) / 10);
  }

  // Analyse d'un coup : impact estimé + mesures sur la dernière seconde
  const TAU = 0.00113; // s par unité de « ballistic ratio » (ajusté sur 4 séances)
  function analyse(s, t) {
    const o = Math.min(s.index, s.n - 1), R = s.rate || 100, x = s.x, y = s.y;
    const c = (s.br || 0) * R * TAU;
    const ix = x[o] + c * (x[o] - x[Math.max(0, o - 1)]), iy = y[o] + c * (y[o] - y[Math.max(0, o - 1)]);
    const r = Math.hypot(ix, iy);
    const a = Math.max(1, o - R + 1), q = Math.max(1, o - Math.round(R / 4) + 1);
    let L = 0, L2 = 0, mx = 0, my = 0, in10 = 0, cnt = 0;
    const edge = t.r10 + t.cal / 2;
    for (let j = a; j <= o; j++) {
      const st = Math.hypot(x[j] - x[j - 1], y[j] - y[j - 1]);
      L += st; if (j >= q) L2 += st;
      mx += x[j]; my += y[j]; cnt++;
      if (Math.hypot(x[j], y[j]) <= edge) in10++;
    }
    mx /= cnt; my /= cnt;
    return { ix, iy, r, score: scoreAt(r, t), aim: o / R, speed: L * R / cnt, speed250: L2 * R / (o - q + 1),
             hold10: in10 / cnt, mx, my, dist: Math.hypot(ix - mx, iy - my), dir: Math.atan2(iy, ix) };
  }

  return { decode, analyse, target, scoreAt, TARGETS };
})();

(() => {
"use strict";
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const fmt = (v, d = 1) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pad = n => String(n).padStart(2, "0");
const dateFr = t => t ? `${pad(t.getUTCDate())}.${pad(t.getUTCMonth() + 1)}.${t.getUTCFullYear()} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}` : "";
let S = null, view = "group", sel = 0;

function load(buf) {
  $("ls-err").style.display = "none";
  try {
    const s = SCATT.decode(buf), t = SCATT.target(s.code);
    let k = 0, m = 0;
    s.shots.forEach(sh => {
      sh.a = SCATT.analyse(sh, t);
      sh.counts = sh.match && !sh.deleted;
      sh.label = sh.counts ? String(++m) : (sh.deleted ? "Suppr." : "E" + (++k));
      sh.serie = sh.counts ? Math.ceil(m / 10) : null;
    });
    S = { ...s, t };
    sel = Math.max(0, s.shots.findIndex(x => x.counts));
    $("ls-app").hidden = false; $("ls-empty").hidden = true;
    render();
  } catch (e) {
    $("ls-err").textContent = "Lecture impossible : " + e.message;
    $("ls-err").style.display = "block";
  }
}

function render() {
  const { t } = S, M = S.shots.filter(x => x.counts);
  $("ls-who").textContent = S.name || "Tireur inconnu";
  const chips = [["", dateFr(S.shots[0]?.time || S.time)], ["", t.label], ["", t.dist + " m"], ["Calibre", t.cal + " mm"],
    ["Mesures", (S.rate || "?") + "/s"], ["Ballistic ratio", S.br ?? "?"]];
  if (S.comment) chips.push(["Note", S.comment]);
  $("ls-chips").innerHTML = chips.map(([k, v]) => `<span class="chip">${k ? k + " " : ""}<b>${esc(String(v))}</b></span>`).join("");
  const sighters = S.shots.filter(x => !x.match).length, del = S.shots.filter(x => x.deleted).length;
  $("ls-note").className = "note" + (t.unknown ? " warn" : "");
  $("ls-note").textContent = `${M.length} coups de match` + (sighters ? `, ${sighters} d'essai` : "") + (del ? `, ${del} supprimé${del > 1 ? "s" : ""}` : "") + "." +
    (t.unknown ? " Discipline non reconnue : cible du pistolet 10 m utilisée par défaut, valeurs à prendre avec prudence." : "");

  // Synthèse
  const tot = M.reduce((a, s) => a + s.a.score, 0), totI = M.reduce((a, s) => a + Math.floor(s.a.score), 0);
  let grp = 0; for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) grp = Math.max(grp, Math.hypot(M[i].a.ix - M[j].a.ix, M[i].a.iy - M[j].a.iy));
  const cx = avg(M, s => s.a.ix), cy = avg(M, s => s.a.iy);
  const times = M.map(s => s.time.getTime()).sort((a, b) => a - b);
  const dur = times.length > 1 ? (times[times.length - 1] - times[0]) / 60000 : 0;
  const tiles = [["Total décimal*", fmt(tot)], ["Total entier*", totI], ["Moyenne*", fmt(M.length ? tot / M.length : 0, 2)],
    ["Groupement", fmt(grp) + " <small>mm</small>"], ["Centre du groupe", fmt(Math.hypot(cx, cy)) + " <small>mm</small>"],
    ["Vitesse moyenne", fmt(avg(M, s => s.a.speed)) + " <small>mm/s</small>"],
    ["Temps de visée", fmt(avg(M, s => s.a.aim)) + " <small>s</small>"], ["Tenue dans le 10", Math.round(100 * avg(M, s => s.a.hold10)) + " <small>%</small>"],
    ["Durée", Math.round(dur) + " <small>min</small>"]];
  $("ls-tiles").innerHTML = tiles.map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
  const ser = {}; M.forEach(s => { (ser[s.serie] ||= []).push(s.a.score); });
  $("ls-series").innerHTML = Object.entries(ser).map(([n, a]) => `<div class="s">Série ${n}<b>${fmt(a.reduce((x, y) => x + y, 0))}</b>${a.reduce((x, y) => x + Math.floor(y), 0)} pts</div>`).join("");

  // Tableau
  $("ls-rows").innerHTML = S.shots.map((s, i) => {
    const a = s.a, low = s.counts && a.score < (t.w >= 20 ? 9 : 10);
    return `<tr data-i="${i}" tabindex="0" class="${i === sel ? "sel" : ""} ${s.counts ? "" : "muted"}">
      <td>${s.label}</td><td>${s.serie ?? "—"}</td><td class="${low ? "low" : ""}">${fmt(a.score)}</td>
      <td>${arrow(a)}</td><td>${fmt(a.aim)} s</td><td>${Math.round(a.hold10 * 100)} %</td>
      <td>${fmt(a.speed)}</td><td>${fmt(a.speed250)}</td><td>${fmt(a.dist)} mm</td></tr>`;
  }).join("");
  drawChart(M);
  select(sel, false);
}

function select(i, scroll = true) {
  if (!S) return;
  sel = Math.max(0, Math.min(S.shots.length - 1, i));
  document.querySelectorAll("#ls-rows tr").forEach(tr => tr.classList.toggle("sel", +tr.dataset.i === sel));
  if (scroll) document.querySelector(`#ls-rows tr[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  const s = S.shots[sel], a = s.a;
  const tag = s.deleted ? `<span class="pill del">Supprimé</span>` : !s.match ? `<span class="pill sighter">Coup d'essai</span>` : `<span class="pill">Série ${s.serie}</span>`;
  $("ls-shot").innerHTML = `
    <div class="head"><div class="num">${s.counts ? "Coup " + s.label : s.label}<small>${dateFr(s.time).slice(-5)}</small></div>
      <div style="display:flex;gap:6px;align-items:center">${tag}
      <button class="ls-btn ghost" type="button" data-step="-1" aria-label="Coup précédent">←</button>
      <button class="ls-btn ghost" type="button" data-step="1" aria-label="Coup suivant">→</button></div></div>
    <dl class="kv">
      <div><dt>Valeur estimée*</dt><dd>${fmt(a.score)}</dd></div>
      <div><dt>Direction</dt><dd>${arrow(a)} ${fmt(a.r)} mm</dd></div>
      <div><dt>Temps de visée</dt><dd>${fmt(a.aim)} s</dd></div>
      <div><dt>Tenue dans le 10</dt><dd>${Math.round(a.hold10 * 100)} %</dd></div>
      <div><dt>Vitesse 1 s</dt><dd>${fmt(a.speed)} mm/s</dd></div>
      <div><dt>Vitesse 250 ms</dt><dd>${fmt(a.speed250)} mm/s</dd></div>
      <div><dt>Écart visée moyenne – impact</dt><dd>${fmt(a.dist)} mm</dd></div>
      <div><dt>Trace enregistrée</dt><dd>${fmt(s.n / (s.rate || 100))} s</dd></div>
    </dl>`;
  drawTarget();
  drawChartSel();
}

function drawTarget() {
  const svg = $("ls-target"), t = S.t, s = S.shots[sel], a = s.a;
  const ring = k => t.r10 + (10 - k) * t.w, outer = ring(1);
  const pts = S.shots.filter(x => $("ls-showAll").checked ? (x.counts || x === s) : x === s);
  let V;
  if (view === "full") V = outer * 1.04;
  else if (view === "shot") {
    const o = s.index, R = s.rate || 100; let m = Math.hypot(a.ix, a.iy);
    for (let j = Math.max(0, o - R); j <= Math.min(s.n - 1, o + Math.round(R * 0.2)); j++) m = Math.max(m, Math.hypot(s.x[j], s.y[j]));
    V = Math.max(m * 1.15, ring(9) * 1.1);
  } else {
    let m = 0; pts.forEach(x => m = Math.max(m, Math.hypot(x.a.ix, x.a.iy)));
    V = Math.max(m + t.cal, ring(9)) * 1.18;
  }
  V = Math.min(V, outer * 1.04);
  svg.setAttribute("viewBox", `${-V} ${-V} ${2 * V} ${2 * V}`);
  svg.innerHTML = "";
  const u = V / 300; // ~1 px d'écran
  const el = (n, at, p = svg) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); p.appendChild(e); return e; };
  el("rect", { x: -V, y: -V, width: 2 * V, height: 2 * V, fill: "var(--paper)" });
  el("circle", { r: ring(t.black), fill: "var(--black)" });
  for (let k = 1; k <= 10; k++) {
    const r = ring(k);
    el("circle", { r, fill: "none", stroke: k > t.black ? "var(--ringOnBlack)" : "#3b4046", "stroke-width": u * (k === 10 ? 1.4 : 1) });
    if (k < 10 && r * 1.0 > u * 18) {
      const lr = r - t.w / 2, fs = Math.min(t.w * 0.45, u * 16);
      [[0, -lr], [0, lr], [-lr, 0], [lr, 0]].forEach(([x, y]) => {
        if (Math.abs(x) < V && Math.abs(y) < V) el("text", { x, y, "font-size": fs, "text-anchor": "middle", "dominant-baseline": "central",
          fill: k > t.black ? "var(--ringOnBlack)" : "#3b4046", "font-family": "Barlow Condensed, sans-serif" }).textContent = k;
      });
    }
  }
  // impacts
  pts.forEach(x => {
    if (x === s) return;
    el("circle", { cx: x.a.ix, cy: x.a.iy, r: t.cal / 2, fill: "#dfe8f4", stroke: "#1b1f23", "stroke-width": u * 0.8, opacity: .9 });
  });
  // trace
  const o = Math.min(s.index, s.n - 1), R = s.rate || 100, after = Math.min(s.n - 1, o + Math.round(R * 0.3));
  const path = (from, to) => { let d = ""; for (let j = Math.max(0, from); j <= to; j++) d += (d ? "L" : "M") + s.x[j].toFixed(2) + " " + s.y[j].toFixed(2); return d; };
  const line = (d, stroke, w, extra = {}) => el("path", { d, fill: "none", stroke, "stroke-width": u * w, "stroke-linejoin": "round", "stroke-linecap": "round", ...extra });
  // Couleurs SCATT : vert jusqu'à 1 s avant, jaune de 1 s à 0,2 s, bleu les 0,2 dernières s, rouge après le coup
  const b = Math.round(R * 0.2);
  line(path(0, o - R), "#2e9e44", 1.3, { opacity: .8 });
  line(path(o - R, o - b), "#e3b60b", 2.2);
  line(path(o - b, o), "#2f6fd6", 2.6);
  line(path(o, after), "#d63a2f", 1.8);
  // visée moyenne
  const c = u * 7;
  el("path", { d: `M${a.mx - c} ${a.my}H${a.mx + c}M${a.mx} ${a.my - c}V${a.my + c}`, stroke: "#e3b60b", "stroke-width": u * 2.2 });
  // impact sélectionné
  el("circle", { cx: a.ix, cy: a.iy, r: t.cal / 2, fill: "rgba(224,96,31,.45)", stroke: "#e0601f", "stroke-width": u * 2.2 });
}

function drawChart(M) {
  const svg = $("ls-chart"), W = svg.clientWidth || 800, H = 150, padL = 34, padB = 18, padT = 8;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.innerHTML = "";
  if (!M.length) return;
  const lo = Math.min(9, Math.floor(Math.min(...M.map(s => s.a.score)))), hi = 10.9;
  const y = v => padT + (hi - v) / (hi - lo) * (H - padT - padB), bw = (W - padL) / M.length;
  const el = (n, at) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); svg.appendChild(e); return e; };
  for (let v = lo; v <= 10; v += 1) {
    el("line", { x1: padL, x2: W, y1: y(v), y2: y(v), stroke: "var(--line)" });
    el("text", { x: padL - 6, y: y(v), "text-anchor": "end", "dominant-baseline": "central", "font-size": 11, fill: "var(--muted)" }).textContent = v;
  }
  M.forEach((s, i) => {
    const x = padL + i * bw + bw * 0.15, v = s.a.score;
    el("rect", { x, y: y(v), width: bw * 0.7, height: Math.max(1, y(lo) - y(v)), rx: 2, fill: v < 10 ? "#e3b60b" : "#e0601f", "data-i": S.shots.indexOf(s), class: "bar", style: "cursor:pointer" });
    if (i % 10 === 0) el("text", { x: x + bw * 0.35, y: H - 4, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" }).textContent = i + 1;
  });
  svg.onclick = e => { const i = e.target.dataset?.i; if (i != null) select(+i); };
}
function drawChartSel() {
  document.querySelectorAll("#ls-chart .bar").forEach(b => b.setAttribute("stroke", +b.dataset.i === sel ? "var(--ink)" : "none"));
}

const avg = (A, f) => A.length ? A.reduce((x, s) => x + f(s), 0) / A.length : 0;
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const arrow = a => a.r < 0.05 ? "•" : `<span class="arrow" style="transform:rotate(${(a.dir * 180 / Math.PI).toFixed(0)}deg)" aria-label="direction">→</span>`;

// Contrôles
$("ls-open").onclick = () => $("ls-file").click();
$("ls-file").onchange = e => { const f = e.target.files[0]; if (f) f.arrayBuffer().then(b => load(new Uint8Array(b))); e.target.value = ""; };
$("ls-shot").onclick = e => { const b = e.target.closest("[data-step]"); if (b) select(sel + (+b.dataset.step)); };
$("ls-rows").onclick = e => { const tr = e.target.closest("tr"); if (tr) select(+tr.dataset.i); };
$("ls-rows").onkeydown = e => { if (e.key === "Enter") { const tr = e.target.closest("tr"); if (tr) select(+tr.dataset.i); } };
$("ls-showAll").onchange = drawTarget;
const views = { "ls-vGroup": "group", "ls-vShot": "shot", "ls-vFull": "full" };
Object.keys(views).forEach(id => $(id).onclick = () => { view = views[id]; Object.keys(views).forEach(k => $(k).setAttribute("aria-pressed", k === id)); drawTarget(); });
document.addEventListener("keydown", e => {
  if (!S || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.key === "ArrowRight") { select(sel + 1); e.preventDefault(); }
  if (e.key === "ArrowLeft") { select(sel - 1); e.preventDefault(); }
});
let dragN = 0;
const dz = () => $("ls-dropzone");
addEventListener("dragenter", e => { e.preventDefault(); dragN++; dz().classList.add("over"); });
addEventListener("dragleave", () => { if (--dragN <= 0) { dragN = 0; dz().classList.remove("over"); } });
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", e => { e.preventDefault(); dragN = 0; dz().classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) f.arrayBuffer().then(b => load(new Uint8Array(b))); });
addEventListener("resize", () => { if (S) { drawChart(S.shots.filter(x => x.counts)); drawChartSel(); } });


})();
