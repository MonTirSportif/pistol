/* MonTirSportif – application « Fiche d'observation pistolet »
   Saisie, enregistrement sur l'appareil, PDF, partage, export / import. */
(function () {
  'use strict';
  var FICHES = window.FO_FICHES;
  var KEY = 'mts_fiches_observation';
  var app = document.getElementById('fo-app');
  if (!app || !FICHES) return;

  /* ---------- Stockage (sur l'appareil uniquement) ---------- */
  var memoire = [];
  var stockageOk = true;
  function lireTout() {
    try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; }
    catch (e) { stockageOk = false; return memoire; }
  }
  function ecrireTout(l) {
    memoire = l;
    try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { stockageOk = false; }
  }
  function uid() { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function aujourdhui() {
    var d = new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function nouvelle(disc) {
    return { id: uid(), disc: disc, date: aujourdhui(), lieu: '', nom: '', age: '', observateur: '', rep: {}, synthese: '', maj: Date.now() };
  }

  var courante = null;
  function sauver() {
    if (!courante) return;
    courante.maj = Date.now();
    var l = lireTout(); var i = l.findIndex(function (f) { return f.id === courante.id; });
    if (i >= 0) l[i] = courante; else l.unshift(courante);
    ecrireTout(l); majCompteur(); etat('Enregistré sur cet appareil');
  }
  var minuteur = null;
  function sauverBientot() { clearTimeout(minuteur); minuteur = setTimeout(sauver, 400); }

  /* ---------- Outils ---------- */
  function el(tag, attrs, enfants) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (enfants || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function rep(k) { return courante.rep[k] || (courante.rep[k] = { sel: [], val: '', com: '', pdv: '' }); }
  function temps(val) {
    var n = (val || '').replace(/,/g, '.').match(/\d+(\.\d+)?/g);
    if (!n || !n.length) return null;
    n = n.map(Number);
    var m = n.reduce(function (a, b) { return a + b; }, 0) / n.length;
    var min = Math.min.apply(null, n), max = Math.max.apply(null, n);
    return { n: n.length, moy: m, min: min, max: max };
  }
  function fmt(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function resumeTemps(val) {
    var t = temps(val); if (!t) return '';
    return t.n + ' mesure' + (t.n > 1 ? 's' : '') + ' : moyenne ' + fmt(t.moy) + ' s, de ' + fmt(t.min) + ' à ' + fmt(t.max) + ' s';
  }
  function dateFr(iso) {
    if (!iso) return ''; var p = iso.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function etat(msg) {
    var s = document.getElementById('fo-etat'); if (!s) return;
    s.textContent = msg; clearTimeout(s._t); s._t = setTimeout(function () { s.textContent = ''; }, 2500);
  }
  function majCompteur() {
    var b = document.getElementById('fo-nb'); if (b) b.textContent = lireTout().length;
  }

  /* ---------- Rendu de la fiche ---------- */
  function rendre() {
    var F = FICHES[courante.disc];
    var zone = document.getElementById('fo-fiche'); zone.innerHTML = '';
    zone.appendChild(el('h2', { text: F.titre }));
    zone.appendChild(el('p', { class: 'fo-sous', text: F.sousTitre }));

    // Identité
    var champs = [['date', 'Date', 'date'], ['lieu', 'Lieu', 'text'], ['nom', 'Tireur (nom)', 'text'], ['age', 'Âge', 'text'], ['observateur', 'Observateur', 'text']];
    var id = el('div', { class: 'fo-ident' });
    champs.forEach(function (c) {
      var inp = el('input', { type: c[2], id: 'fo-' + c[0], value: courante[c[0]] || '', oninput: function (e) { courante[c[0]] = e.target.value; sauverBientot(); } });
      id.appendChild(el('label', {}, [el('span', { text: c[1] }), inp]));
    });
    zone.appendChild(id);

    // Catégories
    F.categories.forEach(function (cat, ci) {
      var sec = el('div', { class: 'fo-cat', id: 'fo-cat-' + ci });
      sec.appendChild(el('h3', { text: cat.nom }));
      cat.items.forEach(function (it, ii) {
        var k = ci + '.' + ii; var r = courante.rep[k] || { sel: [], val: '', com: '', pdv: '' };
        var bloc = el('div', { class: 'fo-item' });
        bloc.appendChild(el('div', { class: 'fo-lib', text: it.l }));
        if (it.o) {
          var ch = el('div', { class: 'fo-chips' });
          it.o.forEach(function (opt) {
            var cb = el('input', { type: 'checkbox', value: opt });
            cb.checked = r.sel.indexOf(opt) >= 0;
            cb.addEventListener('change', function () {
              var x = rep(k); var i = x.sel.indexOf(opt);
              if (cb.checked && i < 0) x.sel.push(opt); if (!cb.checked && i >= 0) x.sel.splice(i, 1);
              sauverBientot();
            });
            ch.appendChild(el('label', { class: 'fo-chip' }, [cb, el('span', { text: opt })]));
          });
          bloc.appendChild(ch);
        } else if (it.t === 'temps') {
          var res = el('div', { class: 'fo-res', text: resumeTemps(r.val) });
          bloc.appendChild(el('input', { type: 'text', inputmode: 'decimal', class: 'fo-val', placeholder: 'Durées en secondes, ex. : 6 7,5 6 8', value: r.val || '',
            oninput: function (e) { rep(k).val = e.target.value; res.textContent = resumeTemps(e.target.value); sauverBientot(); } }));
          bloc.appendChild(res);
        } else {
          bloc.appendChild(el('input', { type: 'text', class: 'fo-val', placeholder: 'Observation', value: r.val || '',
            oninput: function (e) { rep(k).val = e.target.value; sauverBientot(); } }));
        }
        var det = el('details', { class: 'fo-det' });
        if (r.com || r.pdv) det.open = true;
        det.appendChild(el('summary', { text: 'Commentaire et point de vue du tireur' }));
        det.appendChild(el('textarea', { rows: '2', placeholder: 'Commentaire de l’observateur', oninput: function (e) { rep(k).com = e.target.value; sauverBientot(); } }, [r.com || '']));
        det.appendChild(el('textarea', { rows: '2', placeholder: 'Point de vue du tireur', oninput: function (e) { rep(k).pdv = e.target.value; sauverBientot(); } }, [r.pdv || '']));
        bloc.appendChild(det);
        sec.appendChild(bloc);
      });
      zone.appendChild(sec);
    });

    // Synthèse
    var syn = el('div', { class: 'fo-cat', id: 'fo-synthese' });
    syn.appendChild(el('h3', { text: 'Synthèse et objectifs' }));
    syn.appendChild(el('textarea', { rows: '4', placeholder: 'Points forts, point à travailler en priorité, exercices proposés…', oninput: function (e) { courante.synthese = e.target.value; sauverBientot(); } }, [courante.synthese || '']));
    zone.appendChild(syn);

    // Navigation rapide dans la fiche
    var nav = document.getElementById('fo-sauts'); nav.innerHTML = '';
    F.categories.forEach(function (cat, ci) { nav.appendChild(el('a', { href: '#fo-cat-' + ci, text: cat.nom })); });
    nav.appendChild(el('a', { href: '#fo-synthese', text: 'Synthèse' }));
    document.querySelectorAll('.fo-disc button').forEach(function (b) { b.classList.toggle('on', b.dataset.d === courante.disc); });
  }

  /* ---------- Mes fiches ---------- */
  function rendreListe() {
    var box = document.getElementById('fo-liste'); box.innerHTML = '';
    var l = lireTout();
    if (!l.length) { box.appendChild(el('p', { class: 'fo-vide', text: 'Aucune fiche enregistrée sur cet appareil pour l’instant.' })); return; }
    l.sort(function (a, b) { return b.maj - a.maj; }).forEach(function (f) {
      var ligne = el('div', { class: 'fo-ligne' + (courante && f.id === courante.id ? ' cur' : '') });
      ligne.appendChild(el('div', { class: 'fo-lt' }, [
        el('b', { text: (f.nom || 'Sans nom') + ' · ' + FICHES[f.disc].titre }),
        el('small', { text: (dateFr(f.date) || '') + (f.lieu ? ' · ' + f.lieu : '') + (f.observateur ? ' · obs. ' + f.observateur : '') })
      ]));
      var act = el('div', { class: 'fo-la' });
      act.appendChild(el('button', { type: 'button', text: 'Ouvrir', onclick: function () { courante = f; rendre(); rendreListe(); document.getElementById('fo-fiche').scrollIntoView({ behavior: 'smooth' }); } }));
      act.appendChild(el('button', { type: 'button', text: 'Dupliquer', title: 'Nouvelle fiche pour le même tireur', onclick: function () {
        var c = JSON.parse(JSON.stringify(f)); c.id = uid(); c.date = aujourdhui(); c.rep = {}; c.synthese = ''; courante = c; sauver(); rendre(); rendreListe();
      } }));
      var sup = el('button', { type: 'button', class: 'fo-del', text: 'Supprimer' });
      sup.addEventListener('click', function () {
        if (sup.dataset.ok) {
          ecrireTout(lireTout().filter(function (x) { return x.id !== f.id; }));
          if (courante && courante.id === f.id) { courante = nouvelle(f.disc); rendre(); }
          majCompteur(); rendreListe(); etat('Fiche supprimée');
        } else { sup.dataset.ok = '1'; sup.textContent = 'Confirmer la suppression'; setTimeout(function () { delete sup.dataset.ok; sup.textContent = 'Supprimer'; }, 4000); }
      });
      act.appendChild(sup);
      ligne.appendChild(act); box.appendChild(ligne);
    });
  }

  /* ---------- PDF ---------- */
  function txt(s) {
    return String(s || '').replace(/→/g, '->').replace(/≥/g, '>=').replace(/≤/g, '<=')
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFFŒœ‘’“”…€–—]/g, '');
  }
  function nomFichier(ext) {
    var b = 'Observation ' + (courante.nom || 'tireur') + ' ' + (courante.date || '');
    return b.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') + '.' + ext;
  }
  function creerPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('Le module PDF n’a pas pu être chargé.'); return null; }
    var F = FICHES[courante.disc];
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var W = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(224, 96, 31);
    doc.text(txt('Fiche d’observation – ' + F.titre), 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60);
    doc.text(txt(F.sousTitre + ' · MonTirSportif'), 14, 22);
    doc.autoTable({
      startY: 26, theme: 'grid', styles: { fontSize: 9.5, cellPadding: 1.8, textColor: 30 },
      body: [[txt('Date : ' + dateFr(courante.date)), txt('Lieu : ' + (courante.lieu || '')), txt('Observateur : ' + (courante.observateur || ''))],
             [txt('Tireur : ' + (courante.nom || '')), txt('Âge : ' + (courante.age || '')), '']],
      margin: { left: 14, right: 14 }
    });
    F.categories.forEach(function (cat, ci) {
      var body = cat.items.map(function (it, ii) {
        var r = courante.rep[ci + '.' + ii] || { sel: [], val: '', com: '', pdv: '' };
        var obs = it.o ? r.sel.join(', ') : (it.t === 'temps' ? [r.val, resumeTemps(r.val)].filter(Boolean).join('\n') : r.val);
        return [txt(it.l), txt(obs), txt(r.com), txt(r.pdv)];
      });
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 4, theme: 'grid',
        head: [[txt(cat.nom), 'Observé', 'Commentaire', 'Point de vue du tireur']],
        body: body,
        headStyles: { fillColor: [224, 96, 31], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 1.6, textColor: 30, valign: 'top' },
        columnStyles: { 0: { cellWidth: 52, fontStyle: 'bold' }, 1: { cellWidth: 42 }, 2: { cellWidth: 44 }, 3: { cellWidth: 44 } },
        margin: { left: 14, right: 14 }
      });
    });
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 4, theme: 'grid',
      head: [['Synthèse et objectifs']], body: [[txt(courante.synthese || '')]],
      headStyles: { fillColor: [224, 96, 31], textColor: 255 }, styles: { fontSize: 9, minCellHeight: 18, textColor: 30 },
      margin: { left: 14, right: 14 }
    });
    var n = doc.getNumberOfPages();
    for (var p = 1; p <= n; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(120);
      doc.text('MonTirSportif – pistol.montirsportif.com/fiche-observation.html', 14, 290);
      doc.text(p + ' / ' + n, W - 14, 290, { align: 'right' });
    }
    return doc;
  }
  function telecharger(blob, nom) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function resumeTexte() {
    var F = FICHES[courante.disc]; var lignes = ['Fiche d’observation – ' + F.titre, 'Tireur : ' + (courante.nom || '') + ' · ' + dateFr(courante.date) + (courante.lieu ? ' · ' + courante.lieu : ''), ''];
    F.categories.forEach(function (cat, ci) {
      var part = [];
      cat.items.forEach(function (it, ii) {
        var r = courante.rep[ci + '.' + ii]; if (!r) return;
        var obs = it.o ? r.sel.join(', ') : (it.t === 'temps' ? resumeTemps(r.val) : r.val);
        var x = [obs, r.com && ('comm. : ' + r.com), r.pdv && ('tireur : ' + r.pdv)].filter(Boolean).join(' · ');
        if (x) part.push('- ' + it.l + ' : ' + x);
      });
      if (part.length) { lignes.push(cat.nom.toUpperCase()); lignes = lignes.concat(part); lignes.push(''); }
    });
    if (courante.synthese) { lignes.push('SYNTHÈSE'); lignes.push(courante.synthese); }
    return lignes.join('\n');
  }

  /* ---------- Actions ---------- */
  function actionPDF() { var d = creerPDF(); if (d) { d.save(nomFichier('pdf')); etat('PDF créé'); } }
  function actionPartager() {
    var d = creerPDF(); if (!d) return;
    var nom = nomFichier('pdf');
    var fichier = new File([d.output('blob')], nom, { type: 'application/pdf' });
    var titre = 'Fiche d’observation – ' + (courante.nom || 'tireur');
    if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
      navigator.share({ files: [fichier], title: titre, text: titre }).catch(function () {});
    } else {
      telecharger(fichier, nom);
      var m = document.getElementById('fo-mail');
      m.href = 'mailto:?subject=' + encodeURIComponent(titre) + '&body=' + encodeURIComponent('Bonjour,\n\nVoici la fiche d’observation (PDF en pièce jointe).\n\n' + resumeTexte());
      document.getElementById('fo-partage-aide').hidden = false;
    }
  }
  function actionCopier() {
    var t = resumeTexte();
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { etat('Résumé copié'); }, function () { prompt('Copiez le résumé :', t); });
    else prompt('Copiez le résumé :', t);
  }
  function actionExporter() {
    telecharger(new Blob([JSON.stringify({ app: 'mts-fiche-observation', version: 1, fiche: courante }, null, 1)], { type: 'application/json' }), nomFichier('json'));
    etat('Fiche exportée');
  }
  function actionImporter(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result); var x = d.fiche || d;
        if (!x || !FICHES[x.disc] || typeof x.rep !== 'object') throw new Error('format');
        x.id = uid(); courante = x; sauver(); rendre(); rendreListe(); etat('Fiche importée');
      } catch (err) { alert('Ce fichier n’est pas une fiche d’observation MonTirSportif.'); }
      e.target.value = '';
    };
    r.readAsText(f);
  }
  function actionNouvelle(disc) { courante = nouvelle(disc); sauver(); rendre(); rendreListe(); etat('Nouvelle fiche'); }

  /* ---------- Mise en place ---------- */
  app.innerHTML = '';
  var barre = el('div', { class: 'fo-barre' });
  var disc = el('div', { class: 'fo-disc', role: 'group', 'aria-label': 'Choix de la fiche' });
  Object.keys(FICHES).forEach(function (d) {
    var b = el('button', { type: 'button', 'data-d': d, text: FICHES[d].titre });
    b.addEventListener('click', function () {
      if (courante.disc === d) return;
      var vide = !Object.keys(courante.rep).length && !courante.nom;
      if (vide) { courante.disc = d; sauver(); rendre(); } else actionNouvelle(d);
    });
    disc.appendChild(b);
  });
  barre.appendChild(disc);
  var act = el('div', { class: 'fo-actions' });
  act.appendChild(el('button', { type: 'button', class: 'fo-prim', text: 'Créer le PDF', onclick: actionPDF }));
  act.appendChild(el('button', { type: 'button', class: 'fo-prim', text: 'Partager', onclick: actionPartager }));
  act.appendChild(el('button', { type: 'button', text: 'Copier le résumé', onclick: actionCopier }));
  act.appendChild(el('button', { type: 'button', text: 'Nouvelle fiche', onclick: function () { actionNouvelle(courante.disc); } }));
  act.appendChild(el('a', { href: '#fo-mes-fiches', class: 'fo-btn', html: 'Mes fiches (<span id="fo-nb">0</span>)' }));
  barre.appendChild(act);
  barre.appendChild(el('p', { id: 'fo-etat', class: 'fo-etat', 'aria-live': 'polite' }));
  app.appendChild(barre);
  app.appendChild(el('div', { id: 'fo-partage-aide', class: 'tip', hidden: 'hidden', html: '<b>PDF téléchargé.</b> Sur cet appareil, le partage direct n’est pas disponible : joignez le PDF à un e-mail. <a id="fo-mail" href="#">Ouvrir un e-mail avec le résumé</a>' }));
  app.appendChild(el('nav', { id: 'fo-sauts', class: 'fo-sauts', 'aria-label': 'Parties de la fiche' }));
  app.appendChild(el('div', { id: 'fo-fiche' }));

  var mes = document.getElementById('fo-mes-fiches-zone');
  if (mes) {
    mes.appendChild(el('div', { id: 'fo-liste' }));
    var io = el('div', { class: 'fo-io' });
    io.appendChild(el('button', { type: 'button', text: 'Exporter la fiche ouverte (.json)', onclick: actionExporter }));
    var inp = el('input', { type: 'file', accept: '.json,application/json', id: 'fo-import', class: 'fo-hidden' });
    inp.addEventListener('change', actionImporter);
    io.appendChild(inp);
    io.appendChild(el('label', { for: 'fo-import', class: 'fo-btn', text: 'Importer une fiche (.json)' }));
    mes.appendChild(io);
  }

  var l = lireTout();
  courante = l.length ? l.sort(function (a, b) { return b.maj - a.maj; })[0] : nouvelle('10m');
  if (!l.length) sauver();
  rendre(); rendreListe(); majCompteur();
  if (!stockageOk) etat('Enregistrement indisponible sur ce navigateur : pensez à créer le PDF');
})();
