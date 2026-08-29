const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 800], [390, 844]]) {
    const p = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 940, hasTouch: w < 940 }).then(c => c.newPage());
    await p.goto('http://localhost:3007/index.html', { waitUntil: 'networkidle' });

    // 1. BEFORE the reveal: text must still be fully hidden
    const hidden = await p.evaluate(() => {
      document.body.classList.remove('loaded');
      const ln = document.querySelector('.hero h1 .ln'), i = ln.querySelector('i');
      const r = ln.getBoundingClientRect(), ir = i.getBoundingClientRect();
      return { peek: +(r.bottom - ir.top).toFixed(1) };   // >0 means glyphs visible early
    });

    try { await p.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 12000 }); } catch {}
    await p.evaluate(() => document.body.classList.add('loaded'));
    await p.waitForTimeout(2000);

    const m = await p.evaluate(() => {
      const h1 = document.querySelector('.hero h1'), ln = h1.querySelector('.ln');
      const cs = getComputedStyle(h1), lncs = getComputedStyle(ln);
      const probe = document.createElement('span');
      probe.textContent = 'Quiet Craft.';
      probe.style.cssText = `position:absolute;visibility:hidden;font:${cs.font};letter-spacing:${cs.letterSpacing};line-height:normal;white-space:nowrap`;
      document.body.appendChild(probe);
      const natural = probe.getBoundingClientRect().height; probe.remove();
      const clip = ln.getBoundingClientRect().height + parseFloat(lncs.paddingTop) * 0 ; // border-box already includes padding
      return { clip: +clip.toFixed(1), natural: +natural.toFixed(1),
               h1Top: +h1.getBoundingClientRect().top.toFixed(1),
               h1H: +h1.getBoundingClientRect().height.toFixed(1) };
    });
    const slack = +(m.clip - m.natural).toFixed(1);
    console.log(`${String(w).padStart(4)}×${h}  clip ${String(m.clip).padStart(6)}px  glyphs need ${String(m.natural).padStart(6)}px  slack ${slack > 0 ? '+' + slack : slack}px  ${slack >= 0 ? '✓ no clipping' : '⚠ STILL CLIPPED'}   hidden-before-reveal: ${hidden.peek <= 0 ? '✓' : '⚠ peeks ' + hidden.peek + 'px'}   h1 top ${m.h1Top}`);
    if (w === 1920) await p.locator('.hero h1').screenshot({ path: 'hero-after.png' });
    await p.close();
  }
  await b.close();
})();
