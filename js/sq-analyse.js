/* Analyse des impacts SQ (Sport Quantum) : cibles, scores, séries, position, timings.
   Utilisé par « Ma feuille de match » (bloc Statistiques). Rien n'est envoyé : tout se calcule dans le navigateur. */
(function(){
'use strict';
const T={ // cibles ISSF (mm) : r10 = rayon du 10, pas = largeur d'une zone, noirMin = 1re zone noire, x = rayon du 10 intérieur
  p10:{r10:5.75,pas:8,noirMin:7,x:2.5,lab:'Pistolet 10 m'},
  c10:{r10:0.25,pas:2.5,noirMin:4,x:0,lab:'Carabine 10 m'}
};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rad=(t,k)=>t.r10+(10-k)*t.pas;
const iv=p=>Math.floor(p.sd+1e-9);
const virg=v=>String(v).replace('.',',');
const sdev=a=>{if(!a||a.length<2)return null;const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/a.length)};
const sdTxt=a=>{const s=sdev(a);return s==null?'':` · σ ${virg(s.toFixed(2))}`};
function target(t,shots,view){
  const R=view,s=[];
  s.push(`<svg viewBox="${-R} ${-R} ${2*R} ${2*R}" role="img" aria-label="Cible et impacts">`);
  s.push(`<rect x="${-R}" y="${-R}" width="${2*R}" height="${2*R}" fill="#fff"/>`);
  for(let k=1;k<=10;k++){const r=rad(t,k),black=k>=t.noirMin;
    s.push(`<circle r="${r}" fill="${black?'#000':'#fff'}" stroke="${black?'#fff':'#000'}" stroke-width="${t.pas*0.025}"/>`)}
  if(t.x)s.push(`<circle r="${t.x}" fill="none" stroke="#fff" stroke-width="${t.pas*0.025}"/>`);
  const fs=t.pas*0.42;
  for(let k=1;k<=8;k++){const r1=rad(t,k),r2=rad(t,k+1),m=(r1+r2)/2;if(r1>R*1.05)continue;const col=k>=t.noirMin?'#fff':'#000';
    [[m,0],[-m,0],[0,m],[0,-m]].forEach(([x,y],i)=>{if((i<2&&Math.abs(x)<R)||(i>=2&&Math.abs(y)<R))s.push(`<text x="${x}" y="${y}" font-size="${fs}" fill="${col}" text-anchor="middle" dominant-baseline="central" font-family="Arial">${k}</text>`)})}
  const pr=2.25;
  shots.forEach(p=>{s.push(`<g><circle cx="${p.x}" cy="${p.y}" r="${pr}" fill="#2fd3b8" stroke="#fff" stroke-width="0.35"/><text x="${p.x}" y="${p.y}" font-size="${pr*0.95}" fill="#fff" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="Arial">${p.o}</text></g>`)});
  s.push('</svg>');return s.join('');
}
function arrow(x,y){const a=Math.atan2(y,x)*180/Math.PI;return `<svg viewBox="-8 -8 16 16" aria-hidden="true"><g transform="rotate(${a})"><line x1="-5" y1="0" x2="5" y2="0" stroke="#6b7684" stroke-width="1.6"/><path d="M5 0 L1 -3 L1 3 Z" fill="#6b7684"/></g></svg>`}
const ok=d=>d&&d.shots&&d.shots.some(p=>!p.e);
/* Séries numérotées 1, 2, 3… dans l'ordre de tir, quelle que soit la numérotation fournie par la SQ (0 ou 1 au départ, trous). */
function norm(d){
  if(!ok(d)||d._n)return d;
  const m=d.shots.filter(p=>!p.e).slice().sort((a,b)=>(a.o||0)-(b.o||0)||(a.t||0)-(b.t||0));
  const raw=[];m.forEach(p=>{if(!raw.includes(p.s))raw.push(p.s)});
  const per=10;let map;
  if(raw.length>=2&&raw.length<=12&&raw.every(v=>v!=null&&!isNaN(v)))map=p=>raw.indexOf(p.s)+1;
  else{const idx=new Map(m.map((p,i)=>[p,i]));map=p=>Math.floor(idx.get(p)/per)+1}
  return Object.assign({},d,{_n:1,shots:d.shots.map(p=>p.e?p:Object.assign({},p,{s:map(p)}))});
}

/* ---------- Cibles ---------- */
function cibles(data,dec){
  data=norm(data);
  if(!ok(data))return '<div class="sqa-empty">Aucune donnée SQ.</div>';
  const t=T[data.disc]||T.p10,val=p=>dec?p.sd:iv(p);
  const match=data.shots.filter(p=>!p.e),sight=data.shots.filter(p=>p.e);
  const groups=[];if(sight.length)groups.push({name:'Essais',e:true,shots:sight});
  const bySer={};match.forEach(p=>{(bySer[p.s]=bySer[p.s]||[]).push(p)});
  Object.keys(bySer).sort((a,b)=>a-b).forEach(k=>groups.push({name:'Série '+k,shots:bySer[k]}));
  const tot=match.reduce((a,p)=>a+val(p),0),nx=match.filter(p=>p.x10).length;
  const avgAll=match.reduce((a,p)=>a+p.sd,0)/match.length;
  const sers=groups.filter(g=>!g.e).map(g=>g.shots.reduce((a,p)=>a+val(p),0));
  const d=new Date(data.start||Date.now());
  const ds=d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})+', '+d.toLocaleTimeString('fr-FR');
  const maxR=Math.max(...match.map(p=>Math.hypot(p.x,p.y)),rad(t,7))+t.pas*0.6;
  const f=v=>dec?virg(v.toFixed(1)):v;
  let h=`<section class="sqa-card sqa-top"><div>${target(t,match,Math.min(rad(t,1)+1,Math.max(maxR,rad(t,6))))}</div><div class="sqa-info"><div class="sqa-cn">${esc(data.card||t.lab)}<br>${ds}</div><div class="sqa-big">${f(tot)} – ${nx}<span class="sqa-x">✱</span></div><div class="sqa-sers">${sers.map(v=>`<span>${f(v)}</span>`).join('')}</div><div class="sqa-avg">≈ ${virg(avgAll.toFixed(2))}${sdTxt(match.map(val))} par coup${sers.length>1?` · σ séries ${virg(sdev(sers).toFixed(2))}`:''}</div></div></section><div class="sqa-grid">`;
  groups.forEach(g=>{
    const st=g.shots.reduce((a,p)=>a+val(p),0),sx=g.shots.filter(p=>p.x10).length,av=g.shots.reduce((a,p)=>a+p.sd,0)/g.shots.length;
    const vr=Math.max(rad(t,6)+t.pas*0.3,Math.max(...g.shots.map(p=>Math.hypot(p.x,p.y)))+3);
    h+=`<section class="sqa-card sqa-ser"><div>${target(t,g.shots,Math.min(vr,rad(t,1)+1))}</div><ul class="sqa-lst">${g.shots.map(p=>`<li><span class="n">#${p.o}</span><span>${virg(p.sd.toFixed(1))}</span>${arrow(p.x,p.y)}<span class="st">${p.x10?'✱':''}</span></li>`).join('')}</ul><div class="sqa-sum"><div class="t">${g.name}</div><div class="v">${f(st)}</div><div class="m">${sx?sx+' ✱':''}</div><div class="m">≈ ${virg(av.toFixed(2).replace(/0$/,''))}</div><div class="m">${g.shots.length>1?'σ '+virg(sdev(g.shots.map(val)).toFixed(2)):''}</div></div></section>`;
  });
  return h+'</div><p class="sqa-note">✱ : 10 intérieur (mouche). σ : écart type, la dispersion des points autour de la moyenne (plus il est petit, plus le tir est régulier). Les flèches indiquent la direction de chaque impact par rapport au centre.</p>';
}

/* ---------- Graphiques ---------- */
const COL=['#e8577a','#3b8fd9','#f2b440','#b9c0c8','#33b8a8','#8fa3c8','#9b6ad6','#e0803a','#5bbf5b','#d65b9b','#4cc3d9','#a0a0a0'];
const BAND=['rgba(232,87,122,.10)','rgba(91,191,91,.10)','rgba(90,110,230,.12)','rgba(76,195,217,.10)','rgba(214,91,155,.10)','rgba(242,220,64,.13)','rgba(155,106,214,.10)','rgba(224,128,58,.10)'];
function axes(W,H,P,ymin,ymax,ystep){let g='';for(let v=ymin;v<=ymax+1e-9;v+=ystep){const y=P.t+(H-P.t-P.b)*(1-(v-ymin)/(ymax-ymin));g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}" stroke="#e6e9ed"/><text x="${P.l-6}" y="${y}" font-size="10" text-anchor="end" dominant-baseline="central" fill="#6b7684">${virg(Math.round(v*10)/10)}</text>`}return g}
function lineChart(series,labels,ymin,ymax,ystep,opt){opt=opt||{};const W=1000,H=opt.h||260,P={l:40,r:10,t:10,b:26},n=labels.length;const X=i=>P.l+(W-P.l-P.r)*(n<2?0.5:i/(n-1));const Y=v=>P.t+(H-P.t-P.b)*(1-(v-ymin)/(ymax-ymin));
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img">`+axes(W,H,P,ymin,ymax,ystep);
  labels.forEach((l,i)=>{if(n<=70||i%2===0)g+=`<text x="${X(i)}" y="${H-8}" font-size="10" text-anchor="middle" fill="#6b7684">${l}</text>`;if(opt.vgrid)g+=`<line x1="${X(i)}" x2="${X(i)}" y1="${P.t}" y2="${H-P.b}" stroke="#eef0f3"/>`});
  series.forEach((sr,k)=>{const pts=sr.v.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);g+=`<polyline fill="none" stroke="${sr.c||COL[k%COL.length]}" stroke-width="${sr.w||2.4}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;if(sr.dots!==false)pts.forEach(p=>g+=`<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#555"/>`)});
  return g+'</svg>'}
const card=(title,body)=>`<div class="sqa-card sqa-chart">${title?`<h3>${title}</h3>`:''}${body}</div>`;

function scores(data){
  data=norm(data);
  if(!ok(data))return '';
  const all=data.shots,m=all.filter(p=>!p.e),sg=all.filter(p=>p.e);
  const cnt={};m.forEach(p=>cnt[iv(p)]=(cnt[iv(p)]||0)+1);const ks=Object.keys(cnt).map(Number).sort((a,b)=>a-b);const mx=Math.max(...Object.values(cnt));
  const W=1000,H=240,P={l:40,r:10,t:10,b:26},top=Math.ceil(mx/5)*5||5,bw=(W-P.l-P.r)/ks.length;
  const bc=['#f8c9d4','#fde2c4','#fde8c8','#cdeeee','#cfe5fb'],bs=['#e8577a','#f2a65a','#f2b440','#33b8a8','#3b8fd9'];
  let hist=`<svg viewBox="0 0 ${W} ${H}" role="img">`+axes(W,H,P,0,top,5);
  ks.forEach((k,i)=>{const h=(H-P.t-P.b)*cnt[k]/top,x=P.l+i*bw+bw*0.15,y=H-P.b-h,ci=Math.max(0,Math.min(4,k-6));hist+=`<rect x="${x}" y="${y}" width="${bw*0.7}" height="${h}" fill="${bc[ci]}" stroke="${bs[ci]}"/><text x="${x+bw*0.35}" y="${H-8}" font-size="11" text-anchor="middle" fill="#6b7684">${k}</text><text x="${x+bw*0.35}" y="${y-5}" font-size="11" text-anchor="middle" fill="#1b2430">${cnt[k]}</text>`});
  hist+='</svg>';
  const seq=sg.concat(m),lo=Math.max(0,Math.floor(Math.min(...seq.map(p=>p.sd))-1));
  return card('Répartition des scores (SQ)',hist)+evolution(data);
}
function evolution(data){
  data=norm(data);
  if(!ok(data))return '';
  const all=data.shots,m=all.filter(p=>!p.e),sg=all.filter(p=>p.e),seq=sg.concat(m),lo=Math.max(0,Math.floor(Math.min(...seq.map(p=>p.sd))-1));
  return card(`Évolution du score de chaque coup (SQ, décimal)${sdTxt(m.map(p=>p.sd)).replace(' · ',' · écart type ').replace('σ ','')}`,lineChart([{v:seq.map(p=>p.sd),c:'#2fd3b8'}],seq.map(p=>p.o),lo,11,1,{vgrid:true}));
}
function series(data,dec){
  data=norm(data);
  if(!ok(data))return '';
  const all=data.shots,m=all.filter(p=>!p.e),lo=Math.max(0,Math.floor(Math.min(...all.map(p=>p.sd))-1));
  const bySer={};m.forEach(p=>{(bySer[p.s]=bySer[p.s]||[]).push(p)});const sk=Object.keys(bySer).sort((a,b)=>a-b);
  const tots=sk.map(k=>bySer[k].reduce((a,p)=>a+(dec?p.sd:iv(p)),0)),tmin=Math.floor(Math.min(...tots))-1,tmax=Math.ceil(Math.max(...tots))+1;
  const maxLen=Math.max(...sk.map(k=>bySer[k].length));
  const leg='<div class="sqa-leg">'+sk.map((k,i)=>`<span><i style="background:${COL[i%COL.length]}"></i>Série ${k}</span>`).join('')+'</div>';
  return card(`Évolution des scores de série${sdTxt(tots).replace(' · ',' · écart type ').replace('σ ','')}`,lineChart([{v:tots,c:'#2fd3b8'}],sk,tmin,tmax,Math.max(1,Math.round((tmax-tmin)/6)),{vgrid:true,h:220}))
    +card('Score de chaque coup, série par série',leg+'<div class="sqa-leg">'+sk.map(k=>`<span>S${k}${sdTxt(bySer[k].map(p=>dec?p.sd:iv(p))).replace(' · ',' : ')}</span>`).join('')+'</div>'+lineChart(sk.map((k,i)=>({v:bySer[k].map(p=>p.sd),c:COL[i%COL.length],dots:false,w:2})),Array.from({length:maxLen},(_,i)=>i+1),lo,11,1,{vgrid:true}));
}
function position(data,dec,opt){
  data=norm(data);
  if(!ok(data))return '';
  opt=opt||{};const m=data.shots.filter(p=>!p.e),t=T[data.disc]||T.p10;
  const zoom=opt.zoom||'cible',showI=opt.impacts!==false&&zoom!=='cible'||opt.impacts===true;
  const grpR=Math.max(...m.map(p=>Math.hypot(p.x,p.y)))+t.pas*0.6;
  const R=zoom==='groupe'?Math.max(grpR,t.r10+t.pas*0.5):zoom==='noir'?rad(t,t.noirMin)+t.pas*0.4:rad(t,1)+1;
  const L=m.filter(p=>p.x<0).length/m.length,U=m.filter(p=>p.y<0).length/m.length,pc=v=>Math.round(v*100)+' %';
  let heat='';m.forEach(p=>{heat+=`<circle cx="${p.x}" cy="${p.y}" r="${t.pas*0.9}" fill="url(#sqa-hg)"/>`});
  const defs=`<defs><radialGradient id="sqa-hg"><stop offset="0" stop-color="#ff3b1f" stop-opacity=".55"/><stop offset=".45" stop-color="#ffd21f" stop-opacity=".35"/><stop offset="1" stop-color="#2ecc40" stop-opacity="0"/></radialGradient></defs>`;
  let tg=target(t,showI?m:[],R);const cut=tg.indexOf('<g><circle cx');const at=cut>=0?cut:tg.lastIndexOf('</svg>');tg=tg.slice(0,at)+defs+heat+tg.slice(at);
  const zb=(z,l)=>`<button type="button" data-zoom="${z}" aria-pressed="${zoom===z}">${l}</button>`;
  const ctl=`<div class="sqa-zoom" role="group" aria-label="Zoom sur la cible">${zb('cible','Cible entière')}${zb('noir','Zone noire')}${zb('groupe','Groupement')}</div><label class="sqa-chk"><input type="checkbox" data-impacts ${showI?'checked':''}> Afficher les impacts</label>`;
  const bar=(a,b,va)=>`<div class="sqa-prow"><span>${a}</span><span>${b}</span></div><div class="sqa-pbar"><b style="width:${va*100}%"></b><span style="width:${(1-va)*100}%"></span></div><div class="sqa-prow"><span>${pc(va)}</span><span>${pc(1-va)}</span></div>`;
  return `<div class="sqa-pos">${card('Position des impacts',`<p class="sqa-pt">Latéral</p>${bar('Gauche','Droite',L)}<p class="sqa-pt">Hauteur</p>${bar('Haut','Bas',U)}<p class="sqa-note">Groupement moyen : ${virg((m.reduce((a,p)=>a+p.x,0)/m.length).toFixed(1))} mm horizontalement, ${virg((-m.reduce((a,p)=>a+p.y,0)/m.length).toFixed(1))} mm verticalement (positif : vers la droite / vers le haut). Écart type : ${virg(sdev(m.map(p=>p.x)).toFixed(1))} mm horizontalement, ${virg(sdev(m.map(p=>p.y)).toFixed(1))} mm verticalement.</p>`)}${card('Zoom',ctl+tg)}</div>`;
}
function timings(data){
  data=norm(data);
  if(!ok(data))return '';
  const all=data.shots,m=all.filter(p=>!p.e),sg=all.filter(p=>p.e),withT=all.filter(p=>p.t);
  if(withT.length<2)return '<div class="sqa-empty">Pas d’horodatage des coups dans ces données.</div>';
  const lo=Math.max(0,Math.floor(Math.min(...all.map(p=>p.sd))-1));
  const bySer={};m.forEach(p=>{(bySer[p.s]=bySer[p.s]||[]).push(p)});const sk=Object.keys(bySer).sort((a,b)=>a-b);
  const t0=Math.min(...withT.map(p=>p.t)),tm=(Math.max(...withT.map(p=>p.t))-t0)/60000,W=1000,H=260,P={l:40,r:10,t:10,b:30},xmax=Math.ceil(tm/10)*10||10;
  const X=v=>P.l+(W-P.l-P.r)*v/xmax,Y=v=>P.t+(H-P.t-P.b)*(1-(v-lo)/(11-lo));
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  [sg].concat(sk.map(k=>bySer[k])).filter(a=>a.length&&a.some(p=>p.t)).forEach((gp,i)=>{const ts=gp.filter(p=>p.t).map(p=>p.t),a=(Math.min(...ts)-t0)/60000,b=(Math.max(...ts)-t0)/60000;g+=`<rect x="${X(a)}" y="${P.t}" width="${Math.max(2,X(b)-X(a))}" height="${H-P.t-P.b}" fill="${BAND[i%BAND.length]}"/>`});
  g+=axes(W,H,P,lo,11,1);for(let v=0;v<=xmax;v+=10)g+=`<text x="${X(v)}" y="${H-12}" font-size="10" text-anchor="middle" fill="#6b7684">${v}</text>`;
  g+=`<text x="${W/2}" y="${H-1}" font-size="10" text-anchor="middle" fill="#6b7684">Temps (minutes)</text>`;
  const avg=m.reduce((a,p)=>a+p.sd,0)/m.length;g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(avg)}" y2="${Y(avg)}" stroke="#555" stroke-width="1"/>`;
  const sq=withT.slice().sort((a,b)=>a.t-b.t);g+=`<polyline fill="none" stroke="#e8577a" stroke-width="1.8" points="${sq.map(p=>X((p.t-t0)/60000)+','+Y(p.sd)).join(' ')}"/>`;
  sq.forEach(p=>g+=`<circle cx="${X((p.t-t0)/60000)}" cy="${Y(p.sd)}" r="2" fill="#e8577a"/>`);
  const mt=m.filter(p=>p.t).map(p=>p.t).sort((a,b)=>a-b),ints=mt.slice(1).map((t,i)=>(t-mt[i])/1000),gsd=sdev(ints),gap=mt.length>1?Math.round(((Math.max(...mt)-Math.min(...mt))/1000)/(mt.length-1)):null;
  return card('Score de chaque coup dans le temps',g+`</svg><div class="sqa-leg">${sg.length?`<span><i style="background:${BAND[0]}"></i>Essais</span>`:''}${sk.map((k,i)=>`<span><i style="background:${BAND[(i+(sg.length?1:0))%BAND.length]}"></i>Série ${k}</span>`).join('')}<span><i style="background:#555;height:2px"></i>Moyenne du match</span></div><p class="sqa-note" style="text-align:center">Durée totale : ${Math.round(tm)} min${gap!==null?` · temps moyen entre deux coups de match : ${gap} s${gsd!=null?` (écart type ${Math.round(gsd)} s)`:''}`:''}</p>`);
}
window.SQA={ok,cibles,scores,evolution,series,position,timings};
})();
