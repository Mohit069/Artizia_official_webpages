/* ============================================================
   ARTIZIA — inline page editor.

   Runs on the hand-built marketing pages. Two jobs:

   1. PUBLIC (always): fetch this page's saved overrides and apply them to the
      rendered DOM — swapped text, replaced images, new alt text.

   2. EDIT MODE (?edit=1 + a signed-in admin): outline every editable text block
      and image; click text to rewrite it in place, click an image to replace it
      and set its alt text; Save writes the changes back.

   Elements are addressed by a stable structural key (their id when they have
   one, else a path of tag-indexes up to the nearest id'd ancestor), so no
   per-page tagging is needed and the same key resolves on the public page.
   ============================================================ */
(function () {
  const PAGE = document.body.dataset.page || '';
  const MAP = { home: 'index', about: 'about', collections: 'collections' };
  const pageKey = MAP[PAGE];
  if (!pageKey) return;                       // not a wired-up page

  const isEdit = new URLSearchParams(location.search).get('edit') === '1';
  let overrides = {};                         // saved map, applied to the DOM
  const dirty = {};                           // keys changed this session
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- element  <->  key ---------- */
  function keyFor(el) {
    if (el.id) return '#' + el.id;
    const seg = []; let node = el;
    while (node && node !== document.body && node.parentElement) {
      const parent = node.parentElement;
      const same = [...parent.children].filter(c => c.tagName === node.tagName);
      seg.unshift(node.tagName.toLowerCase() + '[' + (same.indexOf(node) + 1) + ']');
      if (parent.id) { seg.unshift('#' + parent.id); return seg.join('/'); }
      node = parent;
    }
    seg.unshift('body');
    return seg.join('/');
  }
  function resolve(key) {
    const parts = key.split('/');
    let ctx = document;
    for (const p of parts) {
      if (p === 'body') { ctx = document.body; continue; }
      if (p[0] === '#') { ctx = document.getElementById(p.slice(1)); if (!ctx) return null; continue; }
      const m = p.match(/^([a-z0-9]+)\[(\d+)\]$/i); if (!m) return null;
      const kids = [...(ctx.children || [])].filter(c => c.tagName === m[1].toUpperCase());
      ctx = kids[+m[2] - 1]; if (!ctx) return null;
    }
    return ctx;
  }

  /* ---------- what counts as editable ---------- */
  const SKIP = 'nav,footer,.tray,.modal,.search,#peBar,.cursor,.cursor-ring,.pe-sec,#pe-sections';
  const TEXT_SEL = 'h1,h2,h3,h4,p,li,blockquote,figcaption,.eyebrow,.lead,.mtitle,.mdesc,.mcoll,.go,.pc-date';
  function editableText(el) {
    if (el.closest(SKIP)) return false;
    if (!el.textContent.trim()) return false;
    if (el.querySelector(TEXT_SEL)) return false;       // a container, not a leaf
    if (el.isContentEditable && el.id === 'bg_body') return false;
    return true;
  }
  const textEls = () => [...document.querySelectorAll(TEXT_SEL)].filter(editableText);
  const imgEls = () => [...document.querySelectorAll('img')].filter(im =>
    !im.closest(SKIP) && !im.closest('.brand') && !im.classList.contains('bed') && im.width !== 0);

  /* strip the per-word animation spans the hero titles add, so we store clean HTML */
  function readValue(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('.w').forEach(w => { const p = w.parentNode; while (w.firstChild) p.insertBefore(w.firstChild, w); p.removeChild(w); });
    c.querySelectorAll('[contenteditable]').forEach(x => x.removeAttribute('contenteditable'));
    c.querySelectorAll('.pe-on').forEach(x => x.classList.remove('pe-on'));
    return c.innerHTML.replace(/\s+/g, ' ').trim();
  }

  /* ---------- apply saved overrides to the live DOM ---------- */
  function applyOverrides() {
    for (const [key, val] of Object.entries(overrides)) {
      if (key.endsWith('__alt')) continue;
      const el = resolve(key); if (!el) continue;
      if (el.tagName === 'IMG') {
        if (el.getAttribute('src') !== val) el.src = val;
      } else if (el.innerHTML !== val) {
        el.innerHTML = val;
      }
    }
    for (const [key, val] of Object.entries(overrides)) {
      if (!key.endsWith('__alt')) continue;
      const el = resolve(key.slice(0, -5));
      if (el && el.tagName === 'IMG' && el.alt !== val) el.alt = val;
    }
  }

  /* the page renders its content asynchronously (some of it after the product
     API returns), so re-apply as nodes arrive, then stop once it settles */
  function watchAndApply() {
    ensureStyle();
    applyOverrides();
    renderSections(false);                    // custom sections added in the editor
    let t; const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(applyOverrides, 50); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 5000);
  }

  const api = (p, o) => fetch(p, Object.assign({ credentials: 'same-origin' }, o));

  /* ================= PUBLIC PATH ================= */
  api('/api/page-content/' + pageKey)
    .then(r => r.ok ? r.json() : { data: {} })
    .then(j => { overrides = j.data || {}; if (!isEdit) watchAndApply(); else { applyOverrides(); startEditor(); } })
    .catch(() => { if (isEdit) startEditor(); });

  /* ================= EDIT MODE ================= */
  function startEditor() {
    api('/api/admin/me').then(r => r.json()).then(s => {
      if (s.authenticated) enterEditMode();
      else notAuthed();
    }).catch(notAuthed);
  }

  function notAuthed() {
    const b = bar();
    b.querySelector('#peMsg').innerHTML =
      'You are not signed in. <a href="/admin.html" style="color:var(--accent);text-decoration:underline">Sign in to the admin panel</a>, then reopen this page.';
    b.querySelector('#peSave').style.display = 'none';
    b.querySelector('#peAdd').style.display = 'none';
  }

  function ensureStyle() {
    if (document.getElementById('peStyle')) return;
    const s = document.createElement('style'); s.id = 'peStyle';
    s.textContent = `
      body.pe-editing .rv{opacity:1!important;transform:none!important}
      #peBar{position:fixed;left:0;right:0;bottom:0;z-index:2000;display:flex;align-items:center;gap:14px;
        padding:12px 18px;background:#0c0c0f;border-top:1px solid rgba(255,255,255,.14);
        font-family:var(--mono,monospace);font-size:12px;color:#e9e6df;box-shadow:0 -12px 40px rgba(0,0,0,.5)}
      #peBar .peTag{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#0A0A0C;background:#cdbbe6;
        padding:4px 9px;border-radius:4px}
      #peBar #peMsg{flex:1;min-width:0;color:#a9a49c}
      #peBar button{font:inherit;padding:8px 16px;border-radius:7px;border:1px solid rgba(255,255,255,.18);
        background:transparent;color:#e9e6df;cursor:pointer;transition:.2s}
      #peBar button:hover{border-color:#cdbbe6;color:#fff}
      #peBar #peSave{background:#cdbbe6;border-color:#cdbbe6;color:#0A0A0C;font-weight:600}
      #peBar #peSave[disabled]{opacity:.4;cursor:default}
      body.pe-editing [data-pe]{outline:1px dashed rgba(205,187,230,.5);outline-offset:3px;cursor:text;
        transition:outline-color .2s;border-radius:2px}
      body.pe-editing [data-pe]:hover{outline-color:#cdbbe6}
      body.pe-editing [data-pe-img]{outline:2px solid rgba(205,187,230,.6);outline-offset:2px;cursor:pointer;position:relative}
      body.pe-editing [data-pe].pe-on{outline:2px solid #cdbbe6;background:rgba(205,187,230,.08)}
      body.pe-editing [data-pe-img]:hover::after{content:"Click to replace";position:absolute;left:8px;top:8px;z-index:5;
        font-family:var(--mono,monospace);font-size:10px;letter-spacing:.08em;text-transform:uppercase;
        background:#0c0c0f;color:#e9e6df;padding:5px 9px;border-radius:4px}
      .pe-imgwrap{position:relative;display:inline-block}

      /* ---- custom sections (video / heading / text / image) ---- */
      #pe-sections{--peserif:var(--serif,Georgia,serif)}
      .pe-sec{padding:clamp(44px,7vw,104px) 0}
      .pe-sec .pe-wrap{max-width:1080px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
      .pe-sec-h{font-family:var(--peserif);font-size:clamp(28px,4vw,52px);line-height:1.1;
        color:var(--text,#f2efe9);margin:0 0 18px}
      .pe-sec-t{color:var(--text-dim,#a9a49c);font-size:clamp(15px,1.5vw,17.5px);line-height:1.8;
        max-width:72ch;margin:0 0 28px;white-space:normal}
      .pe-sec-media{display:flex;flex-direction:column;gap:22px}
      .pe-sec-media img{max-width:100%;height:auto;display:block;border-radius:12px}
      .pe-sec-media video{max-width:100%;height:auto;display:block;border-radius:12px;background:#000}
      .pe-sec-media .pe-vid{position:relative;width:100%;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000}
      .pe-sec-media .pe-vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
      /* editing affordances */
      body.pe-editing .pe-sec{outline:1px dashed rgba(205,187,230,.4);outline-offset:-1px;position:relative}
      .pe-secbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:1080px;margin:0 auto 8px;
        padding:8px clamp(20px,5vw,72px)}
      .pe-secbar .pe-secname{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.14em;
        text-transform:uppercase;color:#cdbbe6;margin-right:auto}
      .pe-secbar button{font-family:var(--mono,monospace);font-size:11px;padding:5px 10px;border-radius:6px;
        border:1px solid rgba(205,187,230,.4);background:transparent;color:#cdbbe6;cursor:pointer}
      .pe-secbar button:hover{background:rgba(205,187,230,.12)}
      .pe-secbar .pe-del{border-color:rgba(224,112,138,.5);color:#e0708a}
      body.pe-editing .pe-sec [data-secfield]{outline:1px dashed rgba(205,187,230,.5);outline-offset:4px;
        cursor:text;border-radius:2px;min-height:1em}
      body.pe-editing .pe-sec [data-secfield].pe-on{outline:2px solid #cdbbe6;background:rgba(205,187,230,.07)}
      body.pe-editing .pe-sec [data-secfield]:empty::before{content:attr(data-ph);color:#6f6a63}
      .pe-imgadd{display:flex;align-items:center;justify-content:center;min-height:160px;border-radius:12px;
        border:2px dashed rgba(205,187,230,.45);color:#cdbbe6;cursor:pointer;font-family:var(--mono,monospace);
        font-size:12px;letter-spacing:.1em;text-transform:uppercase;background:rgba(205,187,230,.04)}
      .pe-imgadd:hover{background:rgba(205,187,230,.1)}
      body.pe-editing .pe-sec-media img{cursor:pointer;outline:2px solid rgba(205,187,230,.5);outline-offset:2px}
      .pe-vidhint{font-family:var(--mono,monospace);font-size:11px;color:#e0a06a;
        border:1px dashed rgba(224,160,106,.5);border-radius:8px;padding:14px}
    `;
    document.head.appendChild(s);
  }
  function bar() {
    let b = document.getElementById('peBar');
    if (b) return b;
    ensureStyle();
    b = document.createElement('div'); b.id = 'peBar';
    b.innerHTML = `<span class="peTag">Editing · ${pageKey}</span>
      <span id="peMsg">Click any text to rewrite it. Click an image to replace it and set alt text.</span>
      <button id="peAdd">+ Add section</button>
      <button id="peExit">Exit</button>
      <button id="peSave" disabled>Save changes</button>`;
    document.body.appendChild(b);
    b.querySelector('#peExit').addEventListener('click', () => {
      if (Object.keys(dirty).length && !confirm('Discard unsaved changes?')) return;
      location.href = location.pathname;      // drop ?edit=1
    });
    b.querySelector('#peSave').addEventListener('click', save);
    b.querySelector('#peAdd').addEventListener('click', addSection);
    return b;
  }
  function markDirty() {
    const n = Object.keys(dirty).length;
    const btn = document.querySelector('#peSave');
    btn.disabled = n === 0;
    btn.textContent = n ? `Save ${n} change${n > 1 ? 's' : ''}` : 'Save changes';
  }

  let fileInput;
  function picker(cb) {
    if (!fileInput) { fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.hidden = true; document.body.appendChild(fileInput); }
    fileInput.value = '';
    fileInput.onchange = () => { const f = fileInput.files[0]; if (f) cb(f); };
    fileInput.click();
  }

  function enterEditMode() {
    document.body.classList.add('pe-editing');
    bar();
    let scan = () => {
      textEls().forEach(el => {
        if (el.dataset.pe) return;
        el.dataset.pe = keyFor(el);
        el.setAttribute('contenteditable', 'true');
        el.addEventListener('focus', () => { el.classList.add('pe-on'); el._peOrig = readValue(el); });
        el.addEventListener('blur', () => {
          el.classList.remove('pe-on');
          const val = readValue(el);
          /* only record a real edit — merely clicking in and out must not freeze
             this element's current (possibly dynamic) text as a saved override */
          if (val === el._peOrig) return;
          dirty[el.dataset.pe] = val; overrides[el.dataset.pe] = val; markDirty();
        });
        /* a link inside editable text must not navigate while you are editing */
        el.addEventListener('click', e => { const a = e.target.closest('a'); if (a) e.preventDefault(); });
      });
      imgEls().forEach(im => {
        if (im.dataset.peImg) return;
        im.dataset.peImg = keyFor(im);
        im.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          picker(file => {
            const fd = new FormData(); fd.append('image', file, file.name);
            document.querySelector('#peMsg').textContent = 'Uploading image…';
            api('/api/upload', { method: 'POST', body: fd }).then(r => r.json()).then(j => {
              if (!j.url) { alert(j.error || 'Upload failed.'); return; }
              im.src = j.url;
              const key = im.dataset.peImg;
              dirty[key] = j.url; overrides[key] = j.url;
              const alt = prompt('Alt text for this image (describe it for SEO & screen readers):', im.alt || '');
              if (alt !== null) { im.alt = alt; dirty[key + '__alt'] = alt; overrides[key + '__alt'] = alt; }
              document.querySelector('#peMsg').textContent = 'Image replaced. Remember to Save.';
              markDirty();
            }).catch(() => alert('Upload failed — are you still signed in?'));
          });
        }, true);
      });
    };
    scan();
    renderSections(true);                     // custom sections + their edit controls
    /* pick up anything that renders late (e.g. the product grid) */
    let t; const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 120); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function save() {
    if (!Object.keys(dirty).length) return;
    const btn = document.querySelector('#peSave'); btn.disabled = true; btn.textContent = 'Saving…';
    api('/api/page-content/' + pageKey, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dirty })
    }).then(r => r.json()).then(j => {
      if (j.ok) {
        for (const k in dirty) delete dirty[k];
        document.querySelector('#peMsg').textContent = '✓ Saved. These changes are now live on the public page.';
        markDirty();
      } else { alert(j.error || 'Save failed.'); btn.disabled = false; markDirty(); }
    }).catch(() => { alert('Save failed — check your connection / session.'); btn.disabled = false; markDirty(); });
  }

  /* ================= CUSTOM SECTIONS ================= */
  /* stored as flat override keys so they save through the same pipeline:
       __seclist            -> "id1,id2"          (order)
       sec.<id>.heading     -> inline HTML
       sec.<id>.text        -> inline HTML (line breaks kept as <br>)
       sec.<id>.image       -> /uploads/… URL
       sec.<id>.image__alt  -> alt text
       sec.<id>.video       -> YouTube / Vimeo / .mp4 URL                          */
  const SEC_FIELDS = ['heading', 'text', 'image', 'image__alt', 'video'];
  const secIds = () => (overrides['__seclist'] || '').split(',').map(s => s.trim()).filter(Boolean);
  function setSecIds(ids) { const v = ids.join(','); overrides['__seclist'] = v; dirty['__seclist'] = v; }
  const secGet = (id, f) => overrides['sec.' + id + '.' + f] || '';
  function secSet(id, f, v) {
    const k = 'sec.' + id + '.' + f;
    if (v == null || v === '') { delete overrides[k]; dirty[k] = ''; } else { overrides[k] = v; dirty[k] = v; }
  }

  /* turn a pasted URL into an embed; unknown URLs render nothing (a hint in edit) */
  function videoEmbed(url) {
    url = (url || '').trim(); if (!url) return '';
    let m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i)))
      return `<div class="pe-vid"><iframe src="https://www.youtube.com/embed/${m[1]}" title="Video" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)))
      return `<div class="pe-vid"><iframe src="https://player.vimeo.com/video/${m[1]}" title="Video" loading="lazy" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe></div>`;
    if (/^https?:\/\/[^\s"'<>]+\.(mp4|webm|ogg)(\?[^\s"'<>]*)?$/i.test(url))
      return `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`;
    return '';
  }

  function secContainer() {
    let c = document.getElementById('pe-sections');
    if (!c) {
      c = document.createElement('div'); c.id = 'pe-sections';
      const footer = document.querySelector('footer');
      if (footer) footer.parentNode.insertBefore(c, footer); else document.body.appendChild(c);
    }
    return c;
  }

  function sectionHTML(id, editing) {
    const h = secGet(id, 'heading'), t = secGet(id, 'text'),
      img = secGet(id, 'image'), alt = secGet(id, 'image__alt'), vid = secGet(id, 'video');
    const media = [];
    if (vid) { const e = videoEmbed(vid); if (e) media.push(e); else if (editing) media.push('<div class="pe-vidhint">Unrecognised video URL — use a YouTube, Vimeo, or direct .mp4 link.</div>'); }
    if (img) media.push(`<img src="${esc(img)}" alt="${esc(alt)}" loading="lazy">`);
    else if (editing) media.push('<div class="pe-imgadd" data-secimg="1">+ Add image</div>');

    if (editing) {
      return `<section class="pe-sec" data-sec="${id}">
        <div class="pe-secbar">
          <span class="pe-secname">Custom section</span>
          <button data-secvid="${id}" type="button">🎬 Video</button>
          <button data-secup="${id}" type="button" title="Move up">↑</button>
          <button data-secdown="${id}" type="button" title="Move down">↓</button>
          <button data-secdel="${id}" type="button" class="pe-del">🗑 Delete</button>
        </div>
        <div class="pe-wrap">
          <h2 class="pe-sec-h" data-secfield="heading" data-secid="${id}" data-ph="Heading…">${h}</h2>
          <div class="pe-sec-t" data-secfield="text" data-secid="${id}" data-ph="Write your text…">${t}</div>
          <div class="pe-sec-media">${media.join('')}</div>
        </div>
      </section>`;
    }
    return `<section class="pe-sec" data-sec="${id}"><div class="pe-wrap">
      ${h ? `<h2 class="pe-sec-h">${h}</h2>` : ''}
      ${t ? `<div class="pe-sec-t">${t}</div>` : ''}
      ${media.length ? `<div class="pe-sec-media">${media.join('')}</div>` : ''}
    </div></section>`;
  }

  function renderSections(editing) {
    const ids = secIds();
    const c = secContainer();
    if (!ids.length && !editing) { c.innerHTML = ''; return; }
    ensureStyle();
    c.innerHTML = ids.map(id => sectionHTML(id, editing)).join('');
    if (editing) wireSections(c);
  }

  function wireSections(c) {
    c.querySelectorAll('[data-secfield]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.addEventListener('focus', () => { el.classList.add('pe-on'); el._peOrig = readValue(el); });
      el.addEventListener('blur', () => {
        el.classList.remove('pe-on');
        const val = readValue(el);
        if (val === el._peOrig) return;         // no real change
        secSet(el.dataset.secid, el.dataset.secfield, val); markDirty();
      });
      /* Enter inserts a line break (<br>), not a <div> the sanitiser would drop */
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak'); } });
    });
    c.querySelectorAll('[data-secimg]').forEach(el => {
      const id = el.closest('.pe-sec').dataset.sec;
      el.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        picker(file => {
          const fd = new FormData(); fd.append('image', file, file.name);
          document.querySelector('#peMsg').textContent = 'Uploading image…';
          api('/api/upload', { method: 'POST', body: fd }).then(r => r.json()).then(j => {
            if (!j.url) { alert(j.error || 'Upload failed.'); return; }
            secSet(id, 'image', j.url);
            const alt = prompt('Alt text for this image (SEO & accessibility):', secGet(id, 'image__alt') || '');
            if (alt !== null) secSet(id, 'image__alt', alt);
            document.querySelector('#peMsg').textContent = 'Image added. Remember to Save.';
            markDirty(); renderSections(true);
          }).catch(() => alert('Upload failed — are you still signed in?'));
        });
      }, true);
    });
    c.querySelectorAll('[data-secvid]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.secvid;
      const u = prompt('Paste a YouTube, Vimeo, or direct .mp4 video URL (leave blank to remove):', secGet(id, 'video'));
      if (u === null) return;
      secSet(id, 'video', u.trim()); markDirty(); renderSections(true);
    }));
    c.querySelectorAll('[data-secdel]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.secdel;
      if (!confirm('Delete this section?')) return;
      SEC_FIELDS.forEach(f => secSet(id, f, ''));
      setSecIds(secIds().filter(x => x !== id));
      markDirty(); renderSections(true);
    }));
    c.querySelectorAll('[data-secup]').forEach(b => b.addEventListener('click', () => moveSec(b.dataset.secup, -1)));
    c.querySelectorAll('[data-secdown]').forEach(b => b.addEventListener('click', () => moveSec(b.dataset.secdown, 1)));
  }

  function moveSec(id, dir) {
    const ids = secIds(), i = ids.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    ids.splice(j, 0, ids.splice(i, 1)[0]);
    setSecIds(ids); markDirty(); renderSections(true);
  }

  function addSection() {
    const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setSecIds(secIds().concat(id));
    secSet(id, 'heading', 'New section heading');
    secSet(id, 'text', 'Add your text here.');
    markDirty(); renderSections(true);
    const el = document.querySelector('.pe-sec[data-sec="' + id + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('#peMsg').textContent = 'New section added — edit its heading, text, image and video, then Save.';
  }
})();
