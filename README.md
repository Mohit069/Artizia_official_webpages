# Artizia — Website

Premium engineered-quartz brand website. Design direction: **"Molten Quartz"** — an obsidian gallery aesthetic with an opal/iridescent accent, a live WebGL stone engine, a cinematic scroll hero, and a Sample Tray lead-capture flow.

No build step. No dependencies. Pure HTML + CSS + vanilla JS.

## Run it

**Easiest:** double-click `index.html` to open in your browser.

**Recommended (for correct `localStorage` behaviour):** serve it locally —

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000

# or Node
npx serve .
```

## Pages

| File | Page |
|------|------|
| `index.html` | Home — cinematic macro → slab → kitchen hero |
| `about.html` | About / story / values |
| `collections.html` | All 26 surfaces, filterable by collection |
| `product.html?p=<slug>` | Product detail (data-driven — one template, 26 products) |
| `contact.html` | Contact + enquiry form |
| `certifications.html` | GreenGuard / NSF / Kosher, explained |
| `technical-details.html` | Full EN/ASTM spec table |
| `warranty.html` | Lifetime warranty + comparison |
| `care-and-maintenance.html` | Care guide |
| `faq.html` | FAQ |

## Structure

```
assets/css/styles.css   Design system (tokens, components, light + dark themes)
assets/js/data.js       Site content — 26 products, collections, specs, FAQ, contact
assets/js/marble.js     WebGL molten-quartz shader + texture baker
assets/js/app.js        Shared chrome: nav, footer, tray, modal, cursor, motion
```

## Editing content

All copy and products live in **`assets/js/data.js`**. To add or edit a surface, add an entry to `MAT` with its palette (`base`/`vein`/`glow` hex, `seed`, `flow`, `sharp`, `dark`) and content (`name`, `code`, `coll`, `desc`, etc.). It appears automatically on the collections grid and gets its own product page.

## Notes / next steps
- The marble is **procedurally generated** (WebGL) as a stand-in for real slab photography. Swap `MarbleGL.imgTag()` usages and the live canvases for real images when available.
- The Sample/Quote/Contact forms are front-end only. Wire them to an email service, form endpoint, or WhatsApp deep-link for production.
- Serve over **HTTPS** in production (the old site was HTTP).
- Consider real webfonts (a high-contrast display serif) via self-hosted `@font-face` for the final polish.
