const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [tag, base] of [['LEGACY', 'http://localhost:3007'], ['REACT ', 'http://localhost:5173']]) {
    console.log(`\n════ ${tag} ════`);
    for (const w of [768, 600, 480, 430, 390, 360, 320]) {
      const p = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 940, hasTouch: w < 940 }).then(c => c.newPage());
      await p.goto(base + '/index.html', { waitUntil: 'networkidle' });
      await p.waitForSelector('nav.nav'); await p.waitForTimeout(500);
      const m = await p.evaluate(() => {
        const img = document.querySelector('.brand img'), r = img.getBoundingClientRect();
        const ar = img.naturalWidth / img.naturalHeight;
        const dw = Math.min(r.width, r.height * ar), dh = Math.min(r.height, r.width / ar);
        const nr = document.querySelector('.nav-right').getBoundingClientRect();
        return { dw: Math.round(dw), dh: Math.round(dh), boxW: Math.round(r.width),
          right: Math.round(nr.width), overflow: document.body.scrollWidth > innerWidth,
          scrollW: document.body.scrollWidth, vw: innerWidth,
          navRightRight: Math.round(nr.right) };
      });
      const flag = m.overflow ? `OVERFLOW ⚠ (${m.scrollW}px)` : 'ok';
      console.log(`  ${String(w).padStart(3)}px  logo drawn ${String(m.dw).padStart(3)}×${String(m.dh).padStart(2)}px   nav-right ${String(m.right).padStart(3)}px ends at ${m.navRightRight}   ${flag}`);
      await p.close();
    }
  }
  await b.close();
})();
