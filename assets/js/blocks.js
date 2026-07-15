/* ============================================================
   ARTIZIA — block system
   ------------------------------------------------------------
   ONE definition, used by both sides:
     • the admin panel builds its editor form from BLOCKS[type].fields
     • page.html renders the saved blocks with BLOCKS[type].render()

   That means adding a new block type is a single edit, here — the
   editor and the front end can never drift apart.

   Field kinds: text | textarea | rich | image | select | check | list
   ============================================================ */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  /* titles may carry <em> for the accent italic — that is the only markup allowed */
  const title = s => String(s == null ? '' : s).replace(/[<>]/g, c => ({ '<': '&lt;', '>': '&gt;' })[c])
    .replace(/&lt;(\/?)(em|br\s*\/?)&gt;/g, '<$1$2>');
  const img = (src, alt, cls, lazy) => src
    ? `<img${cls ? ` class="${cls}"` : ''} src="${esc(src)}" alt="${esc(alt || '')}"${lazy === false ? '' : ' loading="lazy"'}>`
    : '';
  const pad = n => String(n).padStart(2, '0');

  const BLOCKS = {

    /* ---------- a section heading ---------- */
    heading: {
      label: 'Heading',
      icon: 'H',
      fields: [
        { k: 'eyebrow', kind: 'text', label: 'Eyebrow', hint: 'small mono label above the title' },
        { k: 'title', kind: 'text', label: 'Title', hint: 'wrap words in <em>…</em> for the accent italic' },
        { k: 'lead', kind: 'textarea', label: 'Lead paragraph' },
        { k: 'align', kind: 'select', label: 'Align', options: ['left', 'center'], def: 'left' }
      ],
      render: b => `<section class="pad blk blk-heading"><div class="wrap">
        <div class="sec-head rv${b.align === 'center' ? ' center' : ''}"${b.align === 'center' ? ' style="margin:0 auto;text-align:center"' : ''}>
          ${b.eyebrow ? `<span class="eyebrow${b.align === 'center' ? ' center' : ''}">${esc(b.eyebrow)}</span>` : ''}
          ${b.title ? `<h2>${title(b.title)}</h2>` : ''}
          ${b.lead ? `<p>${esc(b.lead)}</p>` : ''}
        </div></div></section>`
    },

    /* ---------- free rich text ---------- */
    richtext: {
      label: 'Text',
      icon: '¶',
      fields: [{ k: 'html', kind: 'rich', label: 'Body' }],
      render: b => `<section class="pad blk blk-text"><div class="wrap">
        <div class="prose-long rv">${b.html || ''}</div></div></section>`
    },

    /* ---------- one image ---------- */
    image: {
      label: 'Image',
      icon: '▣',
      fields: [
        { k: 'src', kind: 'image', label: 'Image' },
        { k: 'alt', kind: 'text', label: 'Alt text', hint: 'describe the image — used by search engines and screen readers' },
        { k: 'caption', kind: 'text', label: 'Caption' },
        { k: 'width', kind: 'select', label: 'Width', options: ['normal', 'wide', 'full'], def: 'wide' }
      ],
      render: b => `<section class="pad blk blk-image"><div class="${b.width === 'full' ? 'wrap-full' : 'wrap'}">
        <figure class="fig rv fig-${esc(b.width || 'wide')}">
          ${img(b.src, b.alt)}
          ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}
        </figure></div></section>`
    },

    /* ---------- image beside text ---------- */
    imagetext: {
      label: 'Image + Text',
      icon: '◧',
      fields: [
        { k: 'src', kind: 'image', label: 'Image' },
        { k: 'alt', kind: 'text', label: 'Alt text' },
        { k: 'side', kind: 'select', label: 'Image side', options: ['left', 'right'], def: 'left' },
        { k: 'eyebrow', kind: 'text', label: 'Eyebrow' },
        { k: 'title', kind: 'text', label: 'Title' },
        { k: 'html', kind: 'rich', label: 'Body' },
        { k: 'ctaLabel', kind: 'text', label: 'Button label' },
        { k: 'ctaHref', kind: 'text', label: 'Button link' }
      ],
      render: b => {
        const media = `<div class="feat-vis rv">${img(b.src, b.alt)}</div>`;
        const copy = `<div class="prose rv d1">
          ${b.eyebrow ? `<span class="eyebrow">${esc(b.eyebrow)}</span>` : ''}
          ${b.title ? `<h3>${title(b.title)}</h3>` : ''}
          ${b.html || ''}
          ${b.ctaLabel ? `<div><a class="btn btn-line mag" href="${esc(b.ctaHref || '#')}"><span>${esc(b.ctaLabel)} <span class="arw">→</span></span></a></div>` : ''}
        </div>`;
        return `<section class="pad blk blk-imagetext"><div class="wrap"><div class="grid-2">
          ${b.side === 'right' ? copy + media : media + copy}
        </div></div></section>`;
      }
    },

    /* ---------- image gallery ---------- */
    gallery: {
      label: 'Gallery',
      icon: '⊞',
      fields: [
        { k: 'cols', kind: 'select', label: 'Columns', options: ['2', '3', '4'], def: '3' },
        {
          k: 'items', kind: 'list', label: 'Images',
          item: [{ k: 'src', kind: 'image', label: 'Image' }, { k: 'alt', kind: 'text', label: 'Alt text' }]
        }
      ],
      render: b => `<section class="pad blk blk-gallery"><div class="wrap">
        <div class="gal rv" style="--cols:${esc(b.cols || 3)}">
          ${(b.items || []).map(i => `<figure>${img(i.src, i.alt)}</figure>`).join('')}
        </div></div></section>`
    },

    /* ---------- counting stats ---------- */
    stats: {
      label: 'Stats',
      icon: '#',
      fields: [{
        k: 'items', kind: 'list', label: 'Stats',
        item: [
          { k: 'value', kind: 'text', label: 'Number', hint: 'counts up from zero' },
          { k: 'suffix', kind: 'text', label: 'Suffix', hint: 'e.g. M sq ft, %, +' },
          { k: 'label', kind: 'text', label: 'Label' }
        ]
      }],
      render: b => `<section class="pad blk blk-stats"><div class="wrap">
        <div class="stats-grid">${(b.items || []).map((s, i) => `
          <div class="stat rv${i ? ' d' + Math.min(i, 3) : ''}">
            <div class="num" data-to="${+s.value || 0}"><span class="v">0</span><span class="suf">${esc(s.suffix || '')}</span></div>
            <div class="lbl">${esc(s.label)}</div>
          </div>`).join('')}</div></div></section>`
    },

    /* ---------- cards ---------- */
    cards: {
      label: 'Cards',
      icon: '▤',
      fields: [
        { k: 'cols', kind: 'select', label: 'Columns', options: ['2', '3', '4'], def: '3' },
        {
          k: 'items', kind: 'list', label: 'Cards',
          item: [
            { k: 'src', kind: 'image', label: 'Image (optional)' },
            { k: 'title', kind: 'text', label: 'Title' },
            { k: 'text', kind: 'textarea', label: 'Text' },
            { k: 'href', kind: 'text', label: 'Link (optional)' }
          ]
        }
      ],
      render: b => `<section class="pad blk blk-cards"><div class="wrap">
        <div class="bcards rv" style="--cols:${esc(b.cols || 3)}">${(b.items || []).map((c, i) => {
        const inner = `${c.src ? `<div class="bc-img">${img(c.src, c.title)}</div>` : ''}
            <div class="bc-body"><span class="n">${pad(i + 1)}</span>
              <h4>${esc(c.title)}</h4><p>${esc(c.text)}</p></div>`;
        return c.href ? `<a class="bcard" href="${esc(c.href)}">${inner}</a>` : `<div class="bcard">${inner}</div>`;
      }).join('')}</div></div></section>`
    },

    /* ---------- pull quote ---------- */
    quote: {
      label: 'Quote',
      icon: '❝',
      fields: [
        { k: 'text', kind: 'textarea', label: 'Quote' },
        { k: 'who', kind: 'text', label: 'Attribution' }
      ],
      render: b => `<section class="pad blk blk-quote"><div class="wrap">
        <blockquote class="bquote rv"><p>${esc(b.text)}</p>${b.who ? `<cite>${esc(b.who)}</cite>` : ''}</blockquote>
      </div></section>`
    },

    /* ---------- video ---------- */
    video: {
      label: 'Video',
      icon: '▶',
      fields: [
        { k: 'src', kind: 'text', label: 'Video file', hint: 'e.g. assets/video/clip.mp4' },
        { k: 'poster', kind: 'image', label: 'Poster image' },
        { k: 'caption', kind: 'text', label: 'Caption' }
      ],
      render: b => `<section class="pad blk blk-video"><div class="wrap">
        <figure class="fig rv fig-wide">
          <video src="${esc(b.src)}"${b.poster ? ` poster="${esc(b.poster)}"` : ''} controls playsinline preload="metadata"></video>
          ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}
        </figure></div></section>`
    },

    /* ---------- call to action ---------- */
    cta: {
      label: 'Call to Action',
      icon: '→',
      fields: [
        { k: 'eyebrow', kind: 'text', label: 'Eyebrow' },
        { k: 'title', kind: 'text', label: 'Title', hint: '<em>…</em> for the accent italic' },
        { k: 'text', kind: 'textarea', label: 'Text' },
        { k: 'aLabel', kind: 'text', label: 'Primary button' },
        { k: 'aHref', kind: 'text', label: 'Primary link' },
        { k: 'bLabel', kind: 'text', label: 'Secondary button' },
        { k: 'bHref', kind: 'text', label: 'Secondary link' }
      ],
      render: b => `<section class="cta pad blk blk-cta"><div class="wrap rv">
        ${b.eyebrow ? `<span class="eyebrow center">${esc(b.eyebrow)}</span>` : ''}
        ${b.title ? `<h2 style="margin-top:22px">${title(b.title)}</h2>` : ''}
        ${b.text ? `<p>${esc(b.text)}</p>` : ''}
        <div class="row">
          ${b.aLabel ? `<a class="btn btn-fill mag" href="${esc(b.aHref || '#')}"><span>${esc(b.aLabel)} <span class="arw">→</span></span></a>` : ''}
          ${b.bLabel ? `<a class="btn btn-line mag" href="${esc(b.bHref || '#')}"><span>${esc(b.bLabel)}</span></a>` : ''}
        </div></div></section>`
    },

    /* ---------- page banner (the hero used by about/faq/etc) ---------- */
    banner: {
      label: 'Page Banner',
      icon: '▬',
      fields: [
        { k: 'src', kind: 'image', label: 'Background image' },
        { k: 'eyebrow', kind: 'text', label: 'Eyebrow' },
        { k: 'title', kind: 'text', label: 'Title', hint: '<em>…</em> for the accent italic, <br> for a line break' },
        { k: 'lead', kind: 'textarea', label: 'Lead' }
      ],
      render: b => `<section class="page-hero blk blk-banner">
        <div class="ph-vis">${img(b.src, b.title, '', false)}</div>
        <div class="wrap">
          ${b.eyebrow ? `<span class="eyebrow">${esc(b.eyebrow)}</span>` : ''}
          ${b.title ? `<h1>${title(b.title)}</h1>` : ''}
          ${b.lead ? `<p class="lead">${esc(b.lead)}</p>` : ''}
        </div></section>`
    },

    /* ---------- divider ---------- */
    divider: {
      label: 'Divider',
      icon: '—',
      fields: [{ k: 'space', kind: 'select', label: 'Spacing', options: ['small', 'medium', 'large'], def: 'medium' }],
      render: b => `<div class="blk blk-divider sp-${esc(b.space || 'medium')}"><div class="wrap"><hr class="vein-rule"></div></div>`
    },

    /* ---------- latest blog posts ---------- */
    posts: {
      label: 'Latest Articles',
      icon: '✎',
      fields: [
        { k: 'title', kind: 'text', label: 'Title', def: 'From the <em>journal.</em>' },
        { k: 'count', kind: 'select', label: 'How many', options: ['3', '6', '9'], def: '3' }
      ],
      render: b => `<section class="pad blk blk-posts"><div class="wrap">
        <div class="sec-head rv" style="margin-bottom:36px"><h2>${title(b.title || 'From the <em>journal.</em>')}</h2></div>
        <div class="post-grid rv" data-posts="${esc(b.count || 3)}"></div>
      </div></section>`
    }
  };

  /* a brand-new block, pre-filled with its defaults */
  function blank(type) {
    const def = BLOCKS[type];
    const b = { type };
    (def.fields || []).forEach(f => {
      if (f.kind === 'list') b[f.k] = [];
      else b[f.k] = f.def != null ? f.def : '';
    });
    return b;
  }

  function renderAll(sections) {
    return (sections || [])
      .filter(b => b && BLOCKS[b.type])
      .map(b => BLOCKS[b.type].render(b))
      .join('\n');
  }

  window.BLOCKS = BLOCKS;
  window.blockBlank = blank;
  window.renderBlocks = renderAll;
})();
