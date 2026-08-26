const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [tag, base] of [['LEGACY', 'http://localhost:3007'], ['REACT ', 'http://localhost:5173']]) {
    console.log(`\n${tag}`);
    for (const w of [600, 480, 430, 390, 375, 360, 320]) {
      const p = await b.newContext({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true }).then(c => c.newPage());
      await p.goto(base + '/index.html', { waitUntil: 'networkidle' });
      await p.waitForSelector('nav.nav'); await p.waitForTimeout(400);
      const m = await p.evaluate(() => {
        const img = document.querySelector('.brand img'), r = img.getBoundingClientRect();
        const ar = img.naturalWidth / img.naturalHeight;
        const bur = document.querySelector('.burger').getBoundingClientRect();
        return { dw: Math.round(Math.min(r.width, r.height*ar)), dh: Math.round(Math.min(r.height, r.width/ar)),
          burEnd: Math.round(bur.right), vw: innerWidth, ov: document.body.scrollWidth > innerWidth };
      });
      console.log(`  ${String(w).padStart(3)}px  logo ${String(m.dw).padStart(3)}×${String(m.dh).padStart(2)}px   burger ends ${String(m.burEnd).padStart(3)}/${m.vw}  ${m.burEnd <= m.vw ? '✓' : '✗ off by ' + (m.burEnd-m.vw)}  body-overflow:${m.ov?'YES':'no'}`);
      await p.close();
    }
  }
  await b.close();
})();
