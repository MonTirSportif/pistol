/* MonTirSportif – application « Fiche d'évaluation individuelle »
   Repères cochés + niveau de maîtrise, toiles d'araignée, PDF, partage, export / import. */
(function () {
  'use strict';
  var FICHES = window.FE_FICHES, NIV = window.FE_NIVEAUX, MAX = NIV.length - 1;
  var KEY = 'mts_fiches_evaluation';
  var app = document.getElementById('fe-app');
  if (!app || !FICHES) return;
  var ACC = '#e0601f';

  /* ---------- Stockage local ---------- */
  var memoire = [], stockageOk = true;
  function lireTout() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch (e) { stockageOk = false; return memoire; } }
  function ecrireTout(l) { memoire = l; try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { stockageOk = false; } }
  function uid() { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function aujourdhui() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function nouvelle(disc) { return { id: uid(), disc: disc, date: aujourdhui(), evaluateur: '', nom: '', prenom: '', rep: {}, synthese: '', maj: Date.now() }; }

  var courante = null, minuteur = null;
  function sauver() {
    courante.maj = Date.now();
    var l = lireTout(), i = l.findIndex(function (f) { return f.id === courante.id; });
    if (i >= 0) l[i] = courante; else l.unshift(courante);
    ecrireTout(l); majCompteur(); etat('Enregistré sur cet appareil');
  }
  function sauverBientot() { clearTimeout(minuteur); minuteur = setTimeout(function () { sauver(); dessinerToiles(); }, 350); }

  /* ---------- Outils ---------- */
  function el(tag, attrs, enfants) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]);
    });
    (enfants || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function rep(k) { return courante.rep[k] || (courante.rep[k] = { sel: [], niv: 0, com: '' }); }
  function dateFr(iso) { if (!iso) return ''; var p = iso.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }
  function etat(m) { var s = document.getElementById('fe-etat'); if (!s) return; s.textContent = m; clearTimeout(s._t); s._t = setTimeout(function () { s.textContent = ''; }, 2500); }
  function majCompteur() { var b = document.getElementById('fe-nb'); if (b) b.textContent = lireTout().length; }
  function qui(f) { return ((f.prenom || '') + ' ' + (f.nom || '')).trim(); }

  /* Évaluation précédente du même tireur, même discipline */
  function precedente() {
    var q = qui(courante).toLowerCase(); if (!q) return null;
    var l = lireTout().filter(function (f) { return f.id !== courante.id && f.disc === courante.disc && qui(f).toLowerCase() === q && (f.date || '') <= (courante.date || '9'); });
    l.sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || b.maj - a.maj; });
    return l[0] || null;
  }

  /* ---------- Toile d'araignée ---------- */
  function toile(ctx, taille, cat, ci, fiche, prec, opts) {
    opts = opts || {};
    var n = cat.items.length, cx = taille / 2, cy = taille / 2 + (opts.titre ? 10 : 0), R = taille * 0.27;
    ctx.save();
    if (opts.fond) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, taille, taille + 20); }
    ctx.font = (opts.titre ? 'bold ' : '') + Math.round(taille * 0.045) + 'px Arial';
    if (opts.titre) { ctx.fillStyle = ACC; ctx.textAlign = 'center'; ctx.fillText(opts.titre, cx, Math.round(taille * 0.06)); }
    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / MAX, cy + Math.sin(a) * R * v / MAX]; }
    ctx.strokeStyle = '#c9cfd6'; ctx.lineWidth = 1;
    for (var lv = 1; lv <= MAX; lv++) { ctx.beginPath(); for (var i = 0; i < n; i++) { var p = pt(i, lv); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath(); ctx.stroke(); }
    for (i = 0; i < n; i++) { var e = pt(i, MAX); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(e[0], e[1]); ctx.stroke(); }
    function poly(f, couleur, remplir, tirets) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) { var r = f.rep[ci + '.' + i]; var p = pt(i, r ? r.niv || 0 : 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.closePath(); ctx.setLineDash(tirets ? [6, 5] : []); ctx.lineWidth = 2.2; ctx.strokeStyle = couleur; ctx.stroke();
      if (remplir) { ctx.fillStyle = remplir; ctx.fill(); }
      ctx.setLineDash([]);
    }
    if (prec) poly(prec, '#7a8594', null, true);
    poly(fiche, ACC, 'rgba(224,96,31,.18)');
    ctx.fillStyle = '#1b2430'; ctx.font = Math.round(taille * 0.036) + 'px Arial';
    for (i = 0; i < n; i++) {
      var q = pt(i, MAX + 0.45), a = -Math.PI / 2 + i * 2 * Math.PI / n, c = Math.cos(a);
      ctx.textAlign = Math.abs(c) < 0.25 ? 'center' : (c > 0 ? 'left' : 'right');
      ctx.textBaseline = 'middle';
      var lab = cat.items[i].a, wl = ctx.measureText(lab).width, x = q[0];
      if (ctx.textAlign === 'left') x = Math.min(x, taille - 4 - wl);
      else if (ctx.textAlign === 'right') x = Math.max(x, 4 + wl);
      else x = Math.min(Math.max(x, 4 + wl / 2), taille - 4 - wl / 2);
      ctx.fillText(lab, x, q[1]);
    }
    ctx.restore();
  }
  function dessinerToiles() {
    var F = FICHES[courante.disc], prec = precedente();
    F.categories.forEach(function (cat, ci) {
      var cv = document.getElementById('fe-toile-' + ci); if (!cv) return;
      var css = Math.min(cv.parentNode.clientWidth || 360, 420), dpr = window.devicePixelRatio || 1;
      cv.style.width = css + 'px'; cv.style.height = css + 'px'; cv.width = css * dpr; cv.height = css * dpr;
      var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, css, css);
      toile(ctx, css, cat, ci, courante, prec, {});
    });
    var lg = document.getElementById('fe-legende');
    if (lg) lg.innerHTML = '<span class="fe-l1"></span> ' + (dateFr(courante.date) || 'Cette évaluation') +
      (prec ? ' &nbsp; <span class="fe-l2"></span> Évaluation précédente du ' + dateFr(prec.date) : ' &nbsp; <small>(la précédente évaluation du même tireur s’affichera en pointillés)</small>');
  }

  /* ---------- Rendu de la fiche ---------- */
  function rendre() {
    var F = FICHES[courante.disc], zone = document.getElementById('fe-fiche'); zone.innerHTML = '';
    zone.appendChild(el('h2', { text: 'Fiche d’évaluation · ' + F.titre }));
    var champs = [['date', 'Date', 'date'], ['evaluateur', 'Évaluateur', 'text'], ['nom', 'Nom', 'text'], ['prenom', 'Prénom', 'text']];
    var id = el('div', { class: 'fo-ident' });
    champs.forEach(function (c) {
      id.appendChild(el('label', {}, [el('span', { text: c[1] }), el('input', { type: c[2], value: courante[c[0]] || '', oninput: function (e) { courante[c[0]] = e.target.value; sauverBientot(); } })]));
    });
    zone.appendChild(id);

    var toiles = el('div', { class: 'fe-toiles', id: 'fe-toiles' });
    F.categories.forEach(function (cat, ci) { toiles.appendChild(el('figure', {}, [el('canvas', { id: 'fe-toile-' + ci, 'aria-label': 'Toile d’araignée : ' + cat.court }), el('figcaption', { text: cat.court })])); });
    zone.appendChild(toiles);
    zone.appendChild(el('p', { id: 'fe-legende', class: 'fe-legende' }));

    F.categories.forEach(function (cat, ci) {
      var sec = el('div', { class: 'fo-cat', id: 'fe-cat-' + ci });
      sec.appendChild(el('h3', { text: cat.nom }));
      cat.items.forEach(function (it, ii) {
        var k = ci + '.' + ii, r = courante.rep[k] || { sel: [], niv: 0, com: '' };
        var bloc = el('div', { class: 'fo-item' });
        bloc.appendChild(el('div', { class: 'fo-lib', text: it.l }));
        var ch = el('div', { class: 'fo-chips' });
        it.o.forEach(function (opt) {
          var cb = el('input', { type: 'checkbox', value: opt }); cb.checked = r.sel.indexOf(opt) >= 0;
          cb.addEventListener('change', function () { var x = rep(k), i = x.sel.indexOf(opt); if (cb.checked && i < 0) x.sel.push(opt); if (!cb.checked && i >= 0) x.sel.splice(i, 1); sauverBientot(); });
          ch.appendChild(el('label', { class: 'fo-chip' }, [cb, el('span', { text: opt })]));
        });
        bloc.appendChild(ch);
        var nv = el('div', { class: 'fe-niv', role: 'radiogroup', 'aria-label': 'Maîtrise : ' + it.a });
        nv.appendChild(el('span', { class: 'fe-niv-t', text: 'Maîtrise :' }));
        NIV.forEach(function (lib, v) {
          var rb = el('input', { type: 'radio', name: 'niv-' + k, value: String(v) }); rb.checked = (r.niv || 0) === v;
          rb.addEventListener('change', function () { rep(k).niv = v; sauverBientot(); });
          nv.appendChild(el('label', { class: 'fo-chip fe-n' + v }, [rb, el('span', { text: lib })]));
        });
        bloc.appendChild(nv);
        var det = el('details', { class: 'fo-det' }); if (r.com) det.open = true;
        det.appendChild(el('summary', { text: 'Commentaire' }));
        det.appendChild(el('textarea', { rows: '2', placeholder: 'Commentaire de l’évaluateur', oninput: function (e) { rep(k).com = e.target.value; sauverBientot(); } }, [r.com || '']));
        bloc.appendChild(det);
        sec.appendChild(bloc);
      });
      zone.appendChild(sec);
    });
    var syn = el('div', { class: 'fo-cat', id: 'fe-synthese' });
    syn.appendChild(el('h3', { text: 'Synthèse et objectifs' }));
    syn.appendChild(el('textarea', { rows: '4', placeholder: 'Points forts, priorité de travail, prochaine étape…', oninput: function (e) { courante.synthese = e.target.value; sauverBientot(); } }, [courante.synthese || '']));
    zone.appendChild(syn);

    var nav = document.getElementById('fe-sauts'); nav.innerHTML = '';
    nav.appendChild(el('a', { href: '#fe-toiles', text: 'Toiles' }));
    F.categories.forEach(function (cat, ci) { nav.appendChild(el('a', { href: '#fe-cat-' + ci, text: cat.court })); });
    nav.appendChild(el('a', { href: '#fe-synthese', text: 'Synthèse' }));
    document.querySelectorAll('.fe-disc button').forEach(function (b) { b.classList.toggle('on', b.dataset.d === courante.disc); });
    dessinerToiles();
  }

  /* ---------- Mes évaluations ---------- */
  function rendreListe() {
    var box = document.getElementById('fe-liste'); box.innerHTML = '';
    var l = lireTout();
    if (!l.length) { box.appendChild(el('p', { class: 'fo-vide', text: 'Aucune évaluation enregistrée sur cet appareil pour l’instant.' })); return; }
    l.sort(function (a, b) { return b.maj - a.maj; }).forEach(function (f) {
      var ligne = el('div', { class: 'fo-ligne' + (f.id === courante.id ? ' cur' : '') });
      ligne.appendChild(el('div', { class: 'fo-lt' }, [el('b', { text: (qui(f) || 'Sans nom') + ' · ' + FICHES[f.disc].titre }), el('small', { text: dateFr(f.date) + (f.evaluateur ? ' · évaluateur : ' + f.evaluateur : '') })]));
      var act = el('div', { class: 'fo-la' });
      act.appendChild(el('button', { type: 'button', text: 'Ouvrir', onclick: function () { courante = f; rendre(); rendreListe(); document.getElementById('fe-fiche').scrollIntoView({ behavior: 'smooth' }); } }));
      act.appendChild(el('button', { type: 'button', text: 'Nouvelle évaluation', title: 'Nouvelle évaluation du même tireur (la précédente s’affiche sur les toiles)', onclick: function () {
        var c = nouvelle(f.disc); c.nom = f.nom; c.prenom = f.prenom; c.evaluateur = f.evaluateur; courante = c; sauver(); rendre(); rendreListe();
      } }));
      var sup = el('button', { type: 'button', class: 'fo-del', text: 'Supprimer' });
      sup.addEventListener('click', function () {
        if (sup.dataset.ok) { ecrireTout(lireTout().filter(function (x) { return x.id !== f.id; })); if (f.id === courante.id) { courante = nouvelle(f.disc); rendre(); } majCompteur(); rendreListe(); etat('Évaluation supprimée'); }
        else { sup.dataset.ok = '1'; sup.textContent = 'Confirmer la suppression'; setTimeout(function () { delete sup.dataset.ok; sup.textContent = 'Supprimer'; }, 4000); }
      });
      act.appendChild(sup); ligne.appendChild(act); box.appendChild(ligne);
    });
  }

  /* ---------- PDF ---------- */
  function txt(s) { return String(s || '').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFFŒœ‘’“”…€–—]/g, ''); }
  function nomFichier(ext) {
    var b = 'Evaluation ' + (qui(courante) || 'tireur') + ' ' + (courante.date || '');
    return b.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '.' + ext;
  }
  function creerPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('Le module PDF n’a pas pu être chargé.'); return null; }
    var F = FICHES[courante.disc], prec = precedente();
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), W = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(224, 96, 31);
    doc.text('Fiche d’évaluation individuelle', 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60);
    doc.text(txt('Discipline : ' + F.titre + ' · MonTirSportif'), 14, 22);
    doc.autoTable({ startY: 26, theme: 'grid', styles: { fontSize: 9.5, cellPadding: 1.8, textColor: 30 },
      body: [[txt('Nom : ' + (courante.nom || '')), txt('Prénom : ' + (courante.prenom || '')), txt('Date : ' + dateFr(courante.date))], [txt('Évaluateur : ' + (courante.evaluateur || '')), '', '']],
      margin: { left: 14, right: 14 } });
    // Toiles
    var y = doc.lastAutoTable.finalY + 4, w = (W - 28 - 6) / 2;
    F.categories.forEach(function (cat, ci) {
      var cv = document.createElement('canvas'); cv.width = 800; cv.height = 820;
      toile(cv.getContext('2d'), 800, cat, ci, courante, prec, { fond: true, titre: cat.court });
      doc.addImage(cv.toDataURL('image/png'), 'PNG', 14 + ci * (w + 6), y, w, w * 820 / 800);
    });
    y += w * 820 / 800 + 2;
    doc.setFontSize(8.5); doc.setTextColor(90);
    doc.text(txt('Maîtrise de 0 (non évalué) à 4 (maîtrisé) · trait plein : ' + dateFr(courante.date) + (prec ? ' · pointillés : évaluation du ' + dateFr(prec.date) : '')), 14, y + 3);
    var dernierY = y + 6;
    F.categories.forEach(function (cat, ci) {
      doc.autoTable({ startY: dernierY + 2, theme: 'grid',
        head: [[txt(cat.nom), 'Observé', 'Maîtrise', 'Commentaire']],
        body: cat.items.map(function (it, ii) { var r = courante.rep[ci + '.' + ii] || { sel: [], niv: 0, com: '' }; return [txt(it.l), txt(r.sel.join(', ')), txt(r.niv ? r.niv + ' · ' + NIV[r.niv] : ''), txt(r.com)]; }),
        headStyles: { fillColor: [224, 96, 31], textColor: 255 },
        styles: { fontSize: 8.5, cellPadding: 1.6, textColor: 30, valign: 'top' },
        columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' }, 1: { cellWidth: 40 }, 2: { cellWidth: 28 }, 3: { cellWidth: 52 } },
        margin: { left: 14, right: 14 } });
      dernierY = doc.lastAutoTable.finalY;
    });
    doc.autoTable({ startY: dernierY + 4, theme: 'grid', head: [['Synthèse et objectifs']], body: [[txt(courante.synthese || '')]],
      headStyles: { fillColor: [224, 96, 31], textColor: 255 }, styles: { fontSize: 9, minCellHeight: 18, textColor: 30 }, margin: { left: 14, right: 14 } });
    var n = doc.getNumberOfPages();
    for (var p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(120); doc.text('MonTirSportif – pistol.montirsportif.com/fiche-evaluation.html', 14, 290); doc.text(p + ' / ' + n, W - 14, 290, { align: 'right' }); }
    return doc;
  }
  function telecharger(blob, nom) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function resumeTexte() {
    var F = FICHES[courante.disc], L = ['Fiche d’évaluation individuelle – ' + F.titre, (qui(courante) || '') + ' · ' + dateFr(courante.date) + (courante.evaluateur ? ' · évaluateur : ' + courante.evaluateur : ''), ''];
    F.categories.forEach(function (cat, ci) {
      L.push(cat.nom.toUpperCase());
      cat.items.forEach(function (it, ii) { var r = courante.rep[ci + '.' + ii]; if (!r) return; var x = [r.sel.join(', '), r.niv ? 'maîtrise ' + r.niv + '/4 (' + NIV[r.niv] + ')' : '', r.com].filter(Boolean).join(' · '); if (x) L.push('- ' + it.a + ' : ' + x); });
      L.push('');
    });
    if (courante.synthese) { L.push('SYNTHÈSE'); L.push(courante.synthese); }
    return L.join('\n');
  }
  function actionPDF() { var d = creerPDF(); if (d) { d.save(nomFichier('pdf')); etat('PDF créé'); } }
  function actionPartager() {
    var d = creerPDF(); if (!d) return;
    var nom = nomFichier('pdf'), fichier = new File([d.output('blob')], nom, { type: 'application/pdf' }), titre = 'Évaluation – ' + (qui(courante) || 'tireur');
    if (navigator.canShare && navigator.canShare({ files: [fichier] })) navigator.share({ files: [fichier], title: titre, text: titre }).catch(function () {});
    else {
      telecharger(fichier, nom);
      document.getElementById('fe-mail').href = 'mailto:?subject=' + encodeURIComponent(titre) + '&body=' + encodeURIComponent('Bonjour,\n\nVoici la fiche d’évaluation (PDF en pièce jointe).\n\n' + resumeTexte());
      document.getElementById('fe-partage-aide').hidden = false;
    }
  }
  function actionCopier() { var t = resumeTexte(); if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { etat('Résumé copié'); }, function () { prompt('Copiez le résumé :', t); }); else prompt('Copiez le résumé :', t); }
  function actionExporter() { telecharger(new Blob([JSON.stringify({ app: 'mts-fiche-evaluation', version: 1, fiche: courante }, null, 1)], { type: 'application/json' }), nomFichier('json')); etat('Évaluation exportée'); }
  function actionImporter(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { var d = JSON.parse(r.result), x = d.fiche || d; if (!x || !FICHES[x.disc] || typeof x.rep !== 'object') throw 0; x.id = uid(); courante = x; sauver(); rendre(); rendreListe(); etat('Évaluation importée'); }
      catch (err) { alert('Ce fichier n’est pas une fiche d’évaluation MonTirSportif.'); }
      e.target.value = '';
    };
    r.readAsText(f);
  }
  function actionNouvelle(disc) { courante = nouvelle(disc); sauver(); rendre(); rendreListe(); etat('Nouvelle évaluation'); }

  /* ---------- Mise en place ---------- */
  app.innerHTML = '';
  var barre = el('div', { class: 'fo-barre' });
  var disc = el('div', { class: 'fo-disc fe-disc', role: 'group', 'aria-label': 'Discipline' });
  Object.keys(FICHES).forEach(function (d) {
    disc.appendChild(el('button', { type: 'button', 'data-d': d, text: FICHES[d].titre, onclick: function () {
      if (courante.disc === d) return;
      if (!Object.keys(courante.rep).length && !courante.nom) { courante.disc = d; sauver(); rendre(); } else actionNouvelle(d);
    } }));
  });
  barre.appendChild(disc);
  var act = el('div', { class: 'fo-actions' });
  act.appendChild(el('button', { type: 'button', class: 'fo-prim', text: 'Créer le PDF', onclick: actionPDF }));
  act.appendChild(el('button', { type: 'button', class: 'fo-prim', text: 'Partager', onclick: actionPartager }));
  act.appendChild(el('button', { type: 'button', text: 'Copier le résumé', onclick: actionCopier }));
  act.appendChild(el('button', { type: 'button', text: 'Nouvelle évaluation', onclick: function () { actionNouvelle(courante.disc); } }));
  act.appendChild(el('a', { href: '#fe-mes-fiches', class: 'fo-btn', html: 'Mes évaluations (<span id="fe-nb">0</span>)' }));
  barre.appendChild(act);
  barre.appendChild(el('p', { id: 'fe-etat', class: 'fo-etat', 'aria-live': 'polite' }));
  app.appendChild(barre);
  app.appendChild(el('div', { id: 'fe-partage-aide', class: 'tip', hidden: 'hidden', html: '<b>PDF téléchargé.</b> Sur cet appareil, le partage direct n’est pas disponible : joignez le PDF à un e-mail. <a id="fe-mail" href="#">Ouvrir un e-mail avec le résumé</a>' }));
  app.appendChild(el('nav', { id: 'fe-sauts', class: 'fo-sauts', 'aria-label': 'Parties de la fiche' }));
  app.appendChild(el('div', { id: 'fe-fiche' }));

  var mes = document.getElementById('fe-mes-fiches-zone');
  if (mes) {
    mes.appendChild(el('div', { id: 'fe-liste' }));
    var io = el('div', { class: 'fo-io' });
    io.appendChild(el('button', { type: 'button', text: 'Exporter l’évaluation ouverte (.json)', onclick: actionExporter }));
    var inp = el('input', { type: 'file', accept: '.json,application/json', id: 'fe-import', class: 'fo-hidden' }); inp.addEventListener('change', actionImporter);
    io.appendChild(inp); io.appendChild(el('label', { for: 'fe-import', class: 'fo-btn', text: 'Importer une évaluation (.json)' }));
    mes.appendChild(io);
  }
  var l = lireTout();
  courante = l.length ? l.sort(function (a, b) { return b.maj - a.maj; })[0] : nouvelle('p10');
  if (!l.length) sauver();
  rendre(); rendreListe(); majCompteur();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(dessinerToiles, 200); });
  if (!stockageOk) etat('Enregistrement indisponible sur ce navigateur : pensez à créer le PDF');
})();
