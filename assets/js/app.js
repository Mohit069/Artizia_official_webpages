/* ============================================================
   ARTIZIA — shared app logic (runs on every page)
   Requires: data.js, marble.js
   ============================================================ */
(function(){
  const S=window.SITE, GL=window.MarbleGL, reduce=GL.reduce;
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const page=document.body.dataset.page||'';

  /* ---------- inject shared chrome ---------- */
  const navLink=(href,label,key)=>`<a href="${href}" class="${key===page?'active':''}">${label}</a>`;
  const nav=document.createElement('nav');nav.className='nav';nav.id='nav';
  nav.innerHTML=`
    <a class="brand" href="index.html"><img class="logo lockup nav-lockup" src="assets/img/brand/logo-full.png" alt="Artizia — Quartz Masterpieces" width="162" height="40"></a>
    <div class="nav-links" id="navLinks">
      <button class="close-x icn" id="navClose" aria-label="Close menu" style="border:0">✕</button>
      ${navLink('index.html','Home','home')}
      ${navLink('about.html','About','about')}
      ${navLink('collections.html','Collections','collections')}
      <div class="nav-drop">
        <a href="technical-details.html" class="${['certifications','technical','warranty','care','faq'].includes(page)?'active':''}">Resources</a>
        <div class="nav-drop-menu">
          <a href="certifications.html">Certifications</a>
          <a href="technical-details.html">Technical Details</a>
          <a href="warranty.html">Warranty</a>
          <a href="care-and-maintenance.html">Care &amp; Maintenance</a>
          <a href="faq.html">FAQs</a>
        </div>
      </div>
      ${navLink('contact.html','Contact','contact')}
    </div>
    <div class="nav-right">
      <button class="icn" id="themeBtn" title="Toggle theme" aria-label="Toggle theme">☀</button>
      <button class="tbtn" id="trayBtn">Samples <span class="tct" id="tct">0</span></button>
      <button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>`;
  document.body.prepend(nav);

  const cursor=document.createElement('div');cursor.className='cursor';cursor.id='cursor';
  const ring=document.createElement('div');ring.className='cursor-ring';ring.id='cursorRing';
  document.body.append(cursor,ring);

  /* Social icons. Inline SVG — nothing loads from an external host. A channel
     with no URL in SITE.social is left out entirely, not rendered as a dead link. */
  const SOCIAL_ICONS={
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none"/>',
    facebook:'<path d="M11.2 21V8.6a2.5 2.5 0 0 1 2.5-2.5h1.9"/><path d="M8.5 12.9h6.1"/>',
    linkedin:'<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7.6" y1="10.6" x2="7.6" y2="17"/><circle cx="7.6" cy="7.1" r="1.05" fill="currentColor" stroke="none"/><path d="M11.2 17v-3.5a2.3 2.3 0 0 1 4.6 0V17"/><line x1="11.2" y1="10.6" x2="11.2" y2="17"/>'
  };
  const SOCIAL_NAMES={instagram:'Instagram',facebook:'Facebook',linkedin:'LinkedIn'};
  function socialHTML(){
    const s=(window.SITE||{}).social||{};
    return Object.keys(SOCIAL_ICONS).filter(k=>s[k]).map(k=>{
      const label=SOCIAL_NAMES[k];
      return `<a href="${s[k]}" target="_blank" rel="noopener noreferrer" aria-label="Artizia on ${label}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SOCIAL_ICONS[k]}</svg></a>`;
    }).join('');
  }

  const footer=document.createElement('footer');
  footer.innerHTML=`<div class="wrap">
    <div class="ftop">
      <div class="fb"><div class="brand"><img class="logo lockup" src="assets/img/brand/logo-full.png" alt="Artizia — Quartz Masterpieces" width="178" height="44"></div>
        <p>Premium engineered quartz — global craftsmanship, Indian design sensibility. Built on 35 years of heritage.</p>
        <div class="fsoc">${socialHTML()}</div>
      </div>
      <div class="fcol"><h5>Collections</h5>
        <a href="collections.html?c=Signature">Signature</a><a href="collections.html?c=Luxury">Luxury</a>
        <a href="collections.html?c=Premium">Premium</a><a href="collections.html?c=Essentials">Essentials</a></div>
      <div class="fcol"><h5>Resources</h5>
        <a href="technical-details.html">Technical Details</a><a href="certifications.html">Certifications</a>
        <a href="warranty.html">Warranty</a><a href="care-and-maintenance.html">Care &amp; Maintenance</a><a href="faq.html">FAQ</a></div>
      <div class="fcol"><h5>Contact</h5>
        <a href="tel:${S.phoneRaw}">${S.phone}</a><a href="mailto:${S.email}">${S.email}</a>
        <a href="${S.mapUrl}" target="_blank" rel="noopener">Mahindra World City,<br>Jaipur — 302037</a>
        <a href="#" id="footSamples" style="color:var(--accent)">Request Samples →</a></div>
    </div>
    <div class="fbot"><span>© 2026 Artizia — All Rights Reserved</span><span>Crafted in Jaipur, India</span></div>
  </div>`;
  document.body.append(footer);

  const tray=document.createElement('div');tray.className='tray';tray.id='tray';tray.setAttribute('role','region');tray.setAttribute('aria-label','Sample tray');
  tray.innerHTML=`<div class="tin">
    <div class="ttl">Your Sample Set · <b><span id="tn">0</span>/4</b></div>
    <div class="tslots" id="tslots"></div>
    <div class="tact"><button class="btn btn-fill mag" id="traySubmit"><span>Request Samples <span class="arw">→</span></span></button>
      <button class="tclose" id="trayClose" aria-label="Close">✕</button></div>
  </div>`;
  document.body.append(tray);

  const modal=document.createElement('div');modal.className='modal';modal.id='modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.innerHTML=`<div class="mcard"><button class="mx" id="modalX" aria-label="Close">✕</button><div id="modal-body"></div></div>`;
  document.body.append(modal);

  const toastEl=document.createElement('div');toastEl.id='toast';document.body.append(toastEl);

  /* ---------- theme ---------- */
  const themeBtn=document.getElementById('themeBtn');
  const stored=localStorage.getItem('artizia_theme')||'dark';
  document.documentElement.setAttribute('data-theme',stored);
  const setTL=()=>themeBtn.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'☀':'☾';setTL();
  themeBtn.addEventListener('click',()=>{const n=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',n);localStorage.setItem('artizia_theme',n);setTL();});

  /* ---------- mobile menu ---------- */
  const navLinks=document.getElementById('navLinks');
  document.getElementById('burger').addEventListener('click',()=>navLinks.classList.add('open'));
  document.getElementById('navClose').addEventListener('click',()=>navLinks.classList.remove('open'));

  /* ---------- toast ---------- */
  let tqt;function toast(m){toastEl.textContent=m;toastEl.style.opacity='1';toastEl.style.transform='translateX(-50%) translateY(0)';
    clearTimeout(tqt);tqt=setTimeout(()=>{toastEl.style.opacity='0';toastEl.style.transform='translateX(-50%) translateY(40px)';},2200);}
  window.toast=toast;

  /* ---------- sample tray ---------- */
  let SAMPLES=[];try{SAMPLES=JSON.parse(localStorage.getItem('artizia_samples')||'[]')}catch(e){}
  const save=()=>{try{localStorage.setItem('artizia_samples',JSON.stringify(SAMPLES))}catch(e){}};
  function renderTray(){
    /* an empty slot is a link to the collections page — a blank dashed box gave
       no clue that it was waiting to be filled, or where you fill it from */
    let h='';for(let i=0;i<4;i++){const k=SAMPLES[i];const m=k&&window.MAT[k];
      h+=k?`<div class="slot on">${GL.imgFor(k,0)}<span class="sn">${m?m.name:k}</span><button class="rm" data-rm="${k}" aria-label="Remove">✕</button></div>`
          :`<a class="slot add" href="collections.html" aria-label="Add a surface — browse the collections" title="Browse collections to add a surface"><span aria-hidden="true">+</span></a>`;}
    document.getElementById('tslots').innerHTML=h;
    document.getElementById('tct').textContent=SAMPLES.length;document.getElementById('tn').textContent=SAMPLES.length;
    document.querySelectorAll('#tslots .rm').forEach(b=>b.addEventListener('click',()=>removeSample(b.dataset.rm)));
    /* already on the collections page? don't reload it — just close the tray and
       take them to the grid they are meant to be picking from */
    document.querySelectorAll('#tslots .slot.add').forEach(a=>a.addEventListener('click',e=>{
      const grid=document.getElementById('grid');
      if(!grid) return;                       /* other pages: follow the href */
      e.preventDefault();
      closeTray();
      grid.scrollIntoView({behavior:GL.reduce?'auto':'smooth',block:'start'});
    }));
  }
  const openTray=()=>tray.classList.add('open');
  const closeTray=()=>tray.classList.remove('open');
  function removeSample(k){SAMPLES=SAMPLES.filter(x=>x!==k);save();renderTray();}
  function addSample(k,btn){
    if(!window.MAT[k])return;
    if(SAMPLES.includes(k)){openTray();toast(window.MAT[k].name+' is already in your set');return;}
    if(SAMPLES.length>=4){openTray();toast('Sample set is full — max 4');return;}
    SAMPLES.push(k);save();renderTray();openTray();try{fly(k,btn)}catch(e){}
  }
  function fly(k,btn){
    if(!btn||reduce)return;const r=btn.getBoundingClientRect();
    const f=document.createElement('div');f.className='fly';f.innerHTML=GL.imgFor(k,0);
    f.style.left=r.left+r.width/2-24+'px';f.style.top=r.top+r.height/2-24+'px';document.body.appendChild(f);
    const slot=document.querySelectorAll('#tslots .slot')[Math.min(SAMPLES.length-1,3)].getBoundingClientRect();
    requestAnimationFrame(()=>{f.style.left=slot.left+5+'px';f.style.top=slot.top+5+'px';f.style.opacity='.3';f.style.transform='scale(.6)';});
    setTimeout(()=>f.remove(),780);
  }
  window.addSample=addSample;window.openTray=openTray;

  /* the top announcement banner was removed — the .topbanner CSS and the
     --banner-h / .has-banner offsets are left in place, so it can be restored
     by re-adding the block here without touching the stylesheet */

  document.getElementById('trayBtn').addEventListener('click',openTray);
  document.getElementById('trayClose').addEventListener('click',closeTray);
  document.getElementById('traySubmit').addEventListener('click',()=>openModal('sample'));
  document.getElementById('footSamples').addEventListener('click',e=>{e.preventDefault();openTray();});
  renderTray();

  /* ---------- modal / forms ---------- */
  function openModal(mode){
    const list=SAMPLES.length?SAMPLES.map(k=>window.MAT[k].name).join(' · '):'None selected yet';
    const q=mode==='quote';
    document.getElementById('modal-body').innerHTML=`
      <span class="eyebrow">${q?'Request a Quote':'Request Free Samples'}</span>
      <h3>${q?'Tell us about your project':'Where should we send them?'}</h3>
      <p>${q?"We'll come back with pricing and lead time for your selection.":'Physical samples, shipped free. Up to four surfaces.'}</p>
      <div class="msel">Selected surfaces: <b>${list}</b></div>
      <form class="form" id="mform">
        <div class="g2"><div class="field"><label>Full Name</label><input required placeholder="Your name"></div>
          <div class="field"><label>Phone</label><input required placeholder="+91"></div></div>
        <div class="field"><label>Email</label><input type="email" required placeholder="you@email.com"></div>
        ${q?`<div class="g2"><div class="field"><label>Project Type</label><select><option>Kitchen</option><option>Bathroom</option><option>Commercial</option><option>Full Home</option><option>Other</option></select></div>
            <div class="field"><label>Approx. Area (sq ft)</label><input placeholder="e.g. 60"></div></div>`
          :`<div class="field"><label>Shipping Address</label><textarea rows="2" required placeholder="Street, city, PIN"></textarea></div>`}
        <div class="mfoot"><button type="button" class="btn btn-line mag" id="mCancel"><span>Cancel</span></button>
          <button type="submit" class="btn btn-fill mag"><span>${q?'Send Enquiry':'Send My Samples'} →</span></button></div>
      </form>`;
    modal.classList.add('open');
    document.getElementById('mCancel').addEventListener('click',closeModal);
    document.getElementById('mform').addEventListener('submit',e=>{e.preventDefault();
      document.getElementById('modal-body').innerHTML=`<div class="msucc"><div class="tick">✓</div><h3>Request received</h3>
        <p style="color:var(--text-dim);margin:12px 0 26px">In the live site this reaches <b style="color:var(--accent)">${S.email}</b> with your surfaces itemised — plus an optional pre-filled WhatsApp handoff.</p>
        <button class="btn btn-fill mag" id="mDone"><span>Done</span></button></div>`;
      document.getElementById('mDone').addEventListener('click',closeModal);bindMag();bindHover();});
    bindMag();bindHover();
  }
  const closeModal=()=>modal.classList.remove('open');
  window.openModal=openModal;
  document.getElementById('modalX').addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeTray();navLinks.classList.remove('open');}});

  /* ---------- scroll nav ---------- */
  let tick=false;
  window.addEventListener('scroll',()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{
    nav.classList.toggle('scrolled',window.scrollY>40);
    if(window.__heroScroll)window.__heroScroll();tick=false;});},{passive:true});
  if(window.scrollY>40)nav.classList.add('scrolled');

  /* ---------- cursor ---------- */
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  if(fine&&!reduce){
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cursor.style.left=mx+'px';cursor.style.top=my+'px';});
    (function r_(){rx+=(mx-rx)*.16;ry+=(my-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(r_);})();
  }else{cursor.style.display='none';ring.style.display='none';}
  function bindHover(){document.querySelectorAll('a,button,summary,input,select,textarea,.gcard,.pcard,.pair,.pth,.why-row').forEach(el=>{
    if(el._hb)return;el._hb=1;el.addEventListener('mouseenter',()=>document.body.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('hovering'));});}
  function bindMag(){if(!fine||reduce)return;document.querySelectorAll('.mag').forEach(el=>{if(el._mb)return;el._mb=1;
    el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`;});
    el.addEventListener('mouseleave',()=>el.style.transform='');});}

  /* ---------- reveal + counters ---------- */
  const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');
    if(en.target.matches('.stat'))countUp(en.target);io.unobserve(en.target);}})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  function revealScan(){document.querySelectorAll('.rv:not(.in)').forEach(el=>io.observe(el));}
  function countUp(st){const num=st.querySelector('.num');if(!num)return;const to=+num.dataset.to,v=num.querySelector('.v');
    if(reduce){v.textContent=to;return;}let s=null;
    (function step(t){if(!s)s=t;const p=Math.min((t-s)/1500,1),e=1-Math.pow(1-p,3);v.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step);})(performance.now());}

  /* ---------- drag gallery ---------- */
  function initDrag(sel){const g=typeof sel==='string'?document.querySelector(sel):sel;if(!g||g._d)return;g._d=1;
    let down=false,sx,sl;
    g.addEventListener('mousedown',e=>{down=true;g.classList.add('dragging');sx=e.pageX;sl=g.scrollLeft;});
    addEventListener('mouseup',()=>{down=false;g.classList.remove('dragging');});
    g.addEventListener('mousemove',e=>{if(!down)return;e.preventDefault();g.scrollLeft=sl-(e.pageX-sx)*1.4;});}

  /* ---------- manifesto word fade ---------- */
  function initManifesto(el){if(!el)return;const html=el.innerHTML;
    el.innerHTML=html.replace(/(<em>.*?<\/em>|[^\s<]+)/g,m=>`<span class="w">${m}</span>`);
    new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.querySelectorAll('.w').forEach((w,i)=>setTimeout(()=>w.style.opacity=w.querySelector('em')?'1':'.9',i*40));}})},{threshold:.4}).observe(el);}

  /* refresh hook — call after injecting dynamic content */
  function refresh(){bindHover();bindMag();revealScan();}

  /* ---------- shared visual slot ----------
     Renders an <img> when a file is given, otherwise falls back to a live
     marble canvas so a page never shows an empty box while photos are pending.
     Returns a cleanup-free canvas ctx (or null) — callers don't need to loop. */
  function marbleSlot(host,matKey,zoom){
    if(!host||!GL) return null;
    host.innerHTML='<canvas></canvas>';
    const c=host.firstElementChild,ctx=GL.makeGL(c);
    if(!ctx) return null;
    const mat=(window.MAT||{})[matKey]||(window.MAT||{})[Object.keys(window.MAT||{})[0]];
    const t0=performance.now();
    (function loop(now){
      if(c.clientWidth) GL.draw(ctx,c,mat,(now-t0)/1000,GL.dpr,zoom||1.4);
      if(!GL.reduce) requestAnimationFrame(loop);
    })(t0);
    return ctx;
  }
  function visual(host,cfg){
    if(!host||!cfg) return;
    if(cfg.image){host.innerHTML=`<img src="${cfg.image}" alt="${(cfg.alt||'').replace(/"/g,'&quot;')}" loading="lazy">`;return;}
    marbleSlot(host,cfg.fallback,cfg.zoom);
  }

  /* ---------- page banner, driven by window.PAGE.banner ---------- */
  function pageBanner(){
    const b=(window.PAGE||{}).banner, host=document.querySelector('.page-hero');
    if(!b||!host) return;
    const eye=host.querySelector('.eyebrow'),h1=host.querySelector('h1'),lead=host.querySelector('.lead');
    if(eye&&b.eyebrow!=null) eye.textContent=b.eyebrow;
    if(h1&&b.title!=null)    h1.innerHTML=b.title;
    if(lead&&b.lead!=null)   lead.innerHTML=b.lead;
    visual(host.querySelector('.ph-vis'),b);
  }

  window.Artizia={refresh,bindHover,bindMag,revealScan,initDrag,initManifesto,openModal,addSample,openTray,toast,visual,marbleSlot,pageBanner,GL,MAT:window.MAT};

  /* ---------- load live products from the backend and hydrate window.MAT ----------
     Replaces the built-in defaults so every page (and the tray) reflects the
     database — including products added/edited via the admin panel. */
  const ready = fetch('/api/products', { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : [])
    .then(list => {
      if (Array.isArray(list) && list.length) {
        Object.keys(window.MAT).forEach(k => { if (!window.MAT[k].hidden) delete window.MAT[k]; });
        list.forEach(p => { window.MAT[p.slug] = p; });
      }
      renderTray();
      return window.MAT;
    })
    .catch(() => window.MAT);   // offline / API down → keep built-in defaults
  window.ArtiziaData = { ready };

  pageBanner();                       /* no-op on pages without window.PAGE.banner */
  document.addEventListener('DOMContentLoaded',refresh);
  refresh();
})();
