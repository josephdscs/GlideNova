// Generates 1200x630 Open Graph images: node og.js -> ../{App}/og.png
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const apps = ['CalmAnchor','ParentScript','Trifect','FotoFav','TimePoll','NextPop','WorkCoach'];

function cssVar(css, name) {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}
function isLight(hex) {
  const h = hex.replace('#','');
  const [r,g,b] = [0,2,4].map(i => parseInt(h.substr(i,2),16));
  return (0.299*r + 0.587*g + 0.114*b) > 150;
}
function b64(file) {
  const ext = path.extname(file).slice(1).replace('jpg','jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  for (const app of apps) {
    const dir = path.join(root, app);
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
    const accent = cssVar(css, 'accent');
    const bg = cssVar(css, 'bg');
    const light = isLight(bg);
    const fg = light ? '#14161C' : '#FFFFFF';
    const muted = light ? 'rgba(20,22,28,0.6)' : 'rgba(255,255,255,0.62)';
    const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/)[1].replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
    const eyebrow = (html.match(/class="hero-eyebrow">([^<]+)</) || [,''])[1].trim();
    const shotFile = fs.readdirSync(path.join(dir, 'screenshots')).filter(f => /\.(png|jpe?g)$/.test(f)).sort()[0];
    const shot = b64(path.join(dir, 'screenshots', shotFile));
    const icon = b64(path.join(dir, 'icon.png'));
    const mac = app === 'FotoFav';
    await page.setContent(`<!doctype html><html><body style="margin:0">
      <div style="width:1200px;height:630px;overflow:hidden;position:relative;background:${bg};
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;color:${fg};">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 90% at 85% 50%, ${accent}55, transparent 70%);"></div>
        <div style="position:absolute;left:72px;top:0;bottom:0;width:${mac ? 520 : 640}px;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:36px;">
            <img src="${icon}" style="width:84px;height:84px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.25)">
            <div style="font-size:40px;font-weight:800;letter-spacing:-.02em">${app}</div>
          </div>
          ${eyebrow ? `<div style="font-size:20px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${accent};margin-bottom:14px">${eyebrow}</div>` : ''}
          <div style="font-size:${h1.length > 40 ? 50 : 58}px;font-weight:800;line-height:1.08;letter-spacing:-.025em;word-spacing:.08em">${h1}</div>
          <div style="margin-top:34px;font-size:22px;color:${muted}">glidenova.com/${app}</div>
        </div>
        ${mac
          ? `<img src="${shot}" style="position:absolute;right:-120px;top:110px;width:660px;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.45)">`
          : `<img src="${shot}" style="position:absolute;right:90px;top:56px;width:300px;border-radius:44px;border:10px solid #111;box-shadow:0 30px 80px rgba(0,0,0,.45)">`}
      </div></body></html>`, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(dir, 'og.png') });
    console.log('wrote', app + '/og.png');
  }
  await browser.close();
})();
