/* MonTirSportif – bouton « Partager » (e-mail, réseaux sociaux, copie du lien) */
(function () {
  var css = '' +
    '.share-wrap{position:relative;display:inline-block;margin-left:.5rem;vertical-align:middle}' +
    '.share-btn{border:1px solid var(--line,#d5dbe3);background:var(--card,#fff);color:var(--txt,#1b2430);border-radius:99px;padding:.35rem .85rem;font:inherit;font-size:.85rem;cursor:pointer}' +
    '.share-btn:hover{border-color:var(--acc,#e5473d)}' +
    '.share-menu{position:absolute;z-index:50;top:calc(100% + .35rem);left:0;min-width:210px;background:var(--card,#fff);border:1px solid var(--line,#d5dbe3);border-radius:12px;box-shadow:0 8px 24px rgba(27,36,48,.14);padding:.35rem;display:flex;flex-direction:column}' +
    '.share-menu[hidden]{display:none}' +
    '.share-menu a,.share-menu button{display:flex;align-items:center;gap:.55rem;padding:.45rem .6rem;border:0;background:none;border-radius:8px;font:inherit;font-size:.88rem;color:var(--txt,#1b2430);text-decoration:none;text-align:left;cursor:pointer;white-space:nowrap}' +
    '.share-menu a:hover,.share-menu button:hover{background:rgba(127,140,155,.12)}' +
    '.share-menu i{font-style:normal;width:1.2rem;text-align:center}' +
    '.share-ok{color:#3d8f2a;font-size:.8rem;padding:.2rem .6rem}' +
    '.share-home{margin:.8rem 0 0}.share-home .share-wrap{margin-left:0}' +
    '@media print{.share-wrap{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function build() {
    var url = location.href.split('#')[0];
    if (location.protocol === 'file:') url = 'https://pistol.montirsportif.com/';
    var title = document.title || 'MonTirSportif';
    var u = encodeURIComponent(url), t = encodeURIComponent(title);
    var links = [
      ['✉️', 'E-mail', 'mailto:?subject=' + t + '&body=' + encodeURIComponent(title + '\n' + url)],
      ['📘', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['💬', 'WhatsApp', 'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url)],
      ['✖️', 'X (Twitter)', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t],
      ['💼', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['✈️', 'Telegram', 'https://t.me/share/url?url=' + u + '&text=' + t],
      ['🦋', 'Bluesky', 'https://bsky.app/intent/compose?text=' + encodeURIComponent(title + ' ' + url)],
      ['📱', 'SMS', 'sms:?&body=' + encodeURIComponent(title + ' ' + url)]
    ];
    var wrap = document.createElement('span'); wrap.className = 'share-wrap';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'share-btn'; btn.textContent = '🔗 Partager';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.title = 'Partager cette page par e-mail ou sur les réseaux sociaux';
    var menu = document.createElement('div'); menu.className = 'share-menu'; menu.hidden = true; menu.setAttribute('role', 'menu');
    if (navigator.share) {
      var n = document.createElement('button'); n.type = 'button'; n.innerHTML = '<i>📤</i>Partager via l’appareil…';
      n.addEventListener('click', function () { navigator.share({ title: title, url: url }).catch(function () {}); close(); });
      menu.appendChild(n);
    }
    links.forEach(function (l) {
      var a = document.createElement('a'); a.href = l[2]; a.setAttribute('role', 'menuitem');
      if (!/^(mailto|sms):/.test(l[2])) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = '<i>' + l[0] + '</i>' + l[1];
      a.addEventListener('click', close);
      menu.appendChild(a);
    });
    var cp = document.createElement('button'); cp.type = 'button'; cp.innerHTML = '<i>📋</i>Copier le lien';
    var ok = document.createElement('div'); ok.className = 'share-ok'; ok.hidden = true; ok.textContent = 'Lien copié ✓';
    cp.addEventListener('click', function () {
      var done = function () { ok.hidden = false; setTimeout(function () { ok.hidden = true; close(); }, 1200); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copiez ce lien :', url); });
      else prompt('Copiez ce lien :', url);
    });
    menu.appendChild(cp); menu.appendChild(ok);
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden));
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    wrap.appendChild(btn); wrap.appendChild(menu);
    return wrap;
  }

  function init() {
    var pb = document.querySelector('.print-btn');
    if (pb) { pb.parentNode.insertBefore(build(), pb.nextSibling); return; }
    var pills = document.querySelector('.hero .pills');
    if (pills) { var d = document.createElement('div'); d.className = 'share-home'; d.appendChild(build()); pills.parentNode.insertBefore(d, pills); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
