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
      ${navLink('blog.html','Blog','blog')}
      <span id="navExtra"></span>
    </div>
    <div class="nav-right">
      <button class="icn" id="searchBtn" title="Search surfaces" aria-label="Search surfaces">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><line x1="15.8" y1="15.8" x2="20" y2="20"/></svg>
      </button>
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
        <a href="collections.html?c=Premium">Premium</a><a href="collections.html?c=Classic">Classic</a>
        <a href="collections.html?c=Essentials">Essentials</a></div>
      <div class="fcol"><h5>Explore</h5>
        <a href="about.html">About</a><a href="blog.html">Blog</a>
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

  /* ---------- surface search ----------
     Searches the live catalogue (window.MAT, hydrated from /api/products) by name,
     code, collection, finish and description. Results link straight to the product
     page; Enter hands the query to the collections grid, which filters on ?q=. */
  const search=document.createElement('div');
  search.className='search';search.id='search';search.setAttribute('role','dialog');
  search.setAttribute('aria-modal','true');search.setAttribute('aria-label','Search surfaces');
  search.innerHTML=`
    <div class="search-panel">
      <div class="search-bar">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><line x1="15.8" y1="15.8" x2="20" y2="20"/></svg>
        <input id="searchInput" type="search" autocomplete="off" spellcheck="false"
          placeholder="Search surfaces — name, code, collection…" aria-label="Search surfaces">
        <button class="icn" id="searchClose" aria-label="Close search" style="border:0">✕</button>
      </div>
      <div class="search-results" id="searchResults" role="listbox"></div>
    </div>`;
  document.body.append(search);

  const sInput=document.getElementById('searchInput');
  const sResults=document.getElementById('searchResults');
  let sHits=[],sPick=-1;

  const norm=s=>String(s||'').toLowerCase();
  function match(q){
    const t=norm(q).trim();
    if(!t) return [];
    const M=window.MAT||{};
    return Object.keys(M).filter(k=>!M[k].hidden&&k!=='hero').map(k=>{
      const m=M[k];
      const name=norm(m.name), code=norm(m.code), coll=norm(m.coll);
      /* rank: a name that starts with the query beats one that merely contains it,
         which beats a hit buried in the description — otherwise "car" surfaces a
         slab whose blurb happens to say "carefully" above Carrara Bianco */
      let score=0;
      if(name===t) score=100;
      else if(name.startsWith(t)) score=80;
      else if(code===t) score=75;
      else if(name.includes(t)) score=60;
      else if(code.includes(t)||coll.includes(t)) score=40;
      else if([m.desc,m.veinText,m.finish,m.grain,(m.apps||[]).join(' ')].some(v=>norm(v).includes(t))) score=20;
      return score?{k,m,score}:null;
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.m.name.localeCompare(b.m.name)).slice(0,8);
  }
  function thumb(k,m){
    const photo=GL.firstPhoto(k);
    return photo?`<img src="${photo}" alt="" loading="lazy">`:GL.imgTag(k,0);
  }
  function paintSearch(){
    const q=sInput.value;
    sHits=match(q); sPick=-1;
    if(!q.trim()){ sResults.innerHTML=`<p class="search-hint">Search by name, code, collection or finish.</p>`; return; }
    if(!sHits.length){
      sResults.innerHTML=`<p class="search-hint">No surfaces match “${q.replace(/[<>&]/g,'')}”.
        <a href="collections.html">Browse all collections →</a></p>`;
      return;
    }
    sResults.innerHTML=sHits.map(({k,m},i)=>`
      <a class="sres" role="option" href="product.html?p=${k}" data-i="${i}">
        <span class="sres-img">${thumb(k,m)}</span>
        <span class="sres-txt"><b>${m.name}</b><span>${m.coll} · No. ${m.code}</span></span>
        <span class="sres-go">→</span>
      </a>`).join('')+
      `<a class="sres-all" href="collections.html?q=${encodeURIComponent(q.trim())}">See all results in Collections →</a>`;
  }
  function highlight(){
    sResults.querySelectorAll('.sres').forEach((el,i)=>el.classList.toggle('on',i===sPick));
    const el=sResults.querySelector('.sres.on'); if(el) el.scrollIntoView({block:'nearest'});
  }
  function openSearch(){
    search.classList.add('open');document.body.classList.add('menu-open');
    sInput.value='';paintSearch();
    /* the panel animates in; focusing mid-transition scrolls the page on iOS */
    setTimeout(()=>sInput.focus(),reduce?0:120);
  }
  function closeSearch(){search.classList.remove('open');document.body.classList.remove('menu-open');}

  document.getElementById('searchBtn').addEventListener('click',openSearch);
  document.getElementById('searchClose').addEventListener('click',closeSearch);
  search.addEventListener('click',e=>{if(e.target===search) closeSearch();});   /* click the backdrop */
  sInput.addEventListener('input',paintSearch);
  sInput.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();sPick=Math.min(sPick+1,sHits.length-1);highlight();}
    else if(e.key==='ArrowUp'){e.preventDefault();sPick=Math.max(sPick-1,-1);highlight();}
    else if(e.key==='Enter'){
      const q=sInput.value.trim(); if(!q) return;
      /* a highlighted result goes straight there; otherwise hand the query to the grid */
      location.href = sPick>=0 ? 'product.html?p='+sHits[sPick].k
                               : 'collections.html?q='+encodeURIComponent(q);
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&search.classList.contains('open')){closeSearch();return;}
    /* ⌘K / Ctrl-K anywhere, and "/" when you are not already typing in a field */
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))||e.target.isContentEditable;
    if(((e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing&&!e.metaKey&&!e.ctrlKey)){
      e.preventDefault();openSearch();
    }
  });

  /* ---------- mobile menu ---------- */
  const navLinks=document.getElementById('navLinks');
  const setMenu=on=>{navLinks.classList.toggle('open',on);document.body.classList.toggle('menu-open',on);};
  document.getElementById('burger').addEventListener('click',()=>setMenu(true));
  document.getElementById('navClose').addEventListener('click',()=>setMenu(false));
  /* in-page links (#anchors) would otherwise leave the menu covering the target */
  navLinks.addEventListener('click',e=>{if(e.target.closest('a')) setMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') setMenu(false);});

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
        <div class="g2"><div class="field"><label>Full Name</label><input name="name" required placeholder="Your name"></div>
          <div class="field"><label>Phone</label><input name="phone" required placeholder="+91"></div></div>
        <div class="field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com"></div>
        ${q?`<div class="g2"><div class="field"><label>Project Type</label><select name="projectType"><option>Kitchen</option><option>Bathroom</option><option>Commercial</option><option>Full Home</option><option>Other</option></select></div>
            <div class="field"><label>Approx. Area (sq ft)</label><input name="area" placeholder="e.g. 60"></div></div>`
          :`<div class="field"><label>Shipping Address</label><textarea name="address" rows="2" required placeholder="Street, city, PIN"></textarea></div>`}
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="mono" id="mErr" style="font-size:11px;color:#E0716A;display:none"></p>
        <div class="mfoot"><button type="button" class="btn btn-line mag" id="mCancel"><span>Cancel</span></button>
          <button type="submit" class="btn btn-fill mag" id="mSend"><span>${q?'Send Enquiry':'Send My Samples'} →</span></button></div>
      </form>`;
    modal.classList.add('open');
    document.getElementById('mCancel').addEventListener('click',closeModal);

    /* real submission — this lands in the database and shows up in the admin panel */
    document.getElementById('mform').addEventListener('submit',async e=>{
      e.preventDefault();
      const f=e.target, btn=document.getElementById('mSend'), err=document.getElementById('mErr');
      btn.disabled=true; err.style.display='none';
      const payload={
        type: q?'quote':'sample',
        name:f.name.value, phone:f.phone.value, email:f.email.value,
        address:f.address?f.address.value:'',
        projectType:f.projectType?f.projectType.value:'',
        area:f.area?f.area.value:'',
        products:SAMPLES.map(k=>(window.MAT[k]||{}).name||k),
        website:f.website.value
      };
      try{
        const r=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const j=await r.json();
        if(!r.ok) throw new Error(j.error||'Could not send your request.');
        document.getElementById('modal-body').innerHTML=`<div class="msucc"><div class="tick">✓</div><h3>Request received</h3>
          <p style="color:var(--text-dim);margin:12px 0 26px">Thank you, ${(payload.name||'').split(' ')[0]||'there'}. Our team will be in touch on <b style="color:var(--accent)">${payload.email}</b> shortly.</p>
          <button class="btn btn-fill mag" id="mDone"><span>Done</span></button></div>`;
        document.getElementById('mDone').addEventListener('click',closeModal);bindMag();bindHover();
      }catch(ex){
        err.textContent='✕ '+ex.message; err.style.display='block'; btn.disabled=false;
      }
    });
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

  /* ---------- reveal + counters ----------
     Two thresholds on purpose. .15 is the one we want — an element reveals once
     it is meaningfully on screen, not the instant one pixel of it appears. But a
     ratio can never reach .15 on an element taller than ~6.7 viewports, and even
     at 1 viewport tall it needs the whole thing on screen; a long article body
     would sit at opacity 0 forever. So anything nearly viewport-height or taller
     reveals as soon as it touches the viewport at all. */
  const io=new IntersectionObserver(es=>{es.forEach(en=>{
    const tall=en.boundingClientRect.height>innerHeight*.85;
    if(en.isIntersecting&&(tall||en.intersectionRatio>=.15)){en.target.classList.add('in');
      if(en.target.matches('.stat'))countUp(en.target);io.unobserve(en.target);}})},
    {threshold:[0,.15],rootMargin:'0px 0px -6% 0px'});
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

  /* ---------- sticky catalogue tab ----------
     Clings to the right edge on every page. Renders only once the server
     confirms a catalogue exists — no dead link if nothing is uploaded yet.
     Hidden on the admin page, which is not a shop window. */
  function catalogueTab(){
    if(document.body.dataset.page==='admin') return;
    fetch('/api/catalogue',{credentials:'same-origin'})
      .then(r=>r.ok?r.json():null)
      .then(c=>{
        if(!c||!c.configured) return;
        const a=document.createElement('a');
        a.className='cat-tab mag';
        a.href=c.url;
        a.target='_blank';
        a.rel='noopener';
        /* a PDF opens in the browser's viewer; an image poster downloads */
        if(c.type!=='pdf') a.download=c.name||'artizia-catalogue';
        a.setAttribute('aria-label','Open the Artizia catalogue'+(c.type==='pdf'?' (PDF)':''));
        a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'
          +'<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v12.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5z"/>'
          +'<path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>'
          +'<span>Catalogue</span>';
        document.body.appendChild(a);
        bindHover(); bindMag();
      })
      .catch(()=>{});   /* API down → no tab, rather than a broken one */
  }
  catalogueTab();

  /* ---------- admin-built pages in the nav ----------
     Any page marked "Show in navigation" appears here. Published only —
     a draft is invisible to visitors even if someone knows the URL. */
  (function customNavLinks(){
    const host=document.getElementById('navExtra');
    if(!host || document.body.dataset.page==='admin') return;
    fetch('/api/pages').then(r=>r.ok?r.json():[]).then(list=>{
      const here=(location.pathname.match(/\/p\/([a-z0-9-]+)/i)||[])[1];
      host.outerHTML=(list||[]).filter(p=>p.inNav).map(p=>
        `<a href="/p/${p.slug}"${here===p.slug?' class="active"':''}>${
          String(p.navLabel||p.title).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c])}</a>`
      ).join('');
      bindHover();
    }).catch(()=>{ host.remove(); });
  })();

  pageBanner();                       /* no-op on pages without window.PAGE.banner */
  document.addEventListener('DOMContentLoaded',refresh);
  refresh();
})();
