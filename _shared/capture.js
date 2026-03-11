#!/usr/bin/env node
// capture.js — render mockup HTML files to PNG screenshots
// Usage: node capture.js <AppName> [--appstore]
//   Default:    web screenshots  (390×844  @2x  = 780×1688px)
//   --appstore: App Store 6.9"   (440×956  @3x  = 1320×2868px) — required by Apple

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const appName    = process.argv[2];
const isAppStore = process.argv.includes('--appstore');

if (!appName) {
  console.error('Usage: node capture.js <AppName> [--appstore]');
  process.exit(1);
}

const websitesDir = path.join(__dirname, '..');
const mockupsDir  = path.join(websitesDir, appName, 'mockups');
const outputDir   = path.join(websitesDir, appName, isAppStore ? 'screenshots-appstore' : 'screenshots');

if (!fs.existsSync(mockupsDir)) {
  console.error(`Mockups directory not found: ${mockupsDir}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

// Viewport config
// --appstore: iPhone 16 Pro Max 6.9" — 440×956 logical @3x = 1320×2868px (Apple required size)
// default:    iPhone 14 logical @2x = 780×1688px (web use)
const viewport = isAppStore
  ? { width: 440, height: 956, deviceScaleFactor: 3 }   // 1320×2868 output
  : { width: 390, height: 844, deviceScaleFactor: 2 };   // 780×1688 output

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const mockups = fs.readdirSync(mockupsDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  if (mockups.length === 0) {
    console.log('No mockup HTML files found.');
    await browser.close();
    process.exit(0);
  }

  console.log(`Capturing ${mockups.length} mockups for ${appName} (${isAppStore ? 'App Store 6.9"' : 'web'})...`);

  for (const file of mockups) {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    const filePath = `file://${path.join(mockupsDir, file)}`;
    await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 10000 });

    // Let any CSS animations settle
    await new Promise(r => setTimeout(r, 300));

    const outputFile = path.join(outputDir, file.replace('.html', '.png'));
    await page.screenshot({ path: outputFile, fullPage: false, omitBackground: true });
    await page.close();

    const actualW = viewport.width  * viewport.deviceScaleFactor;
    const actualH = viewport.height * viewport.deviceScaleFactor;
    console.log(`  ✓ ${file} → ${outputFile.split('/').pop()} (${actualW}×${actualH}px)`);
  }

  await browser.close();
  console.log(`\nDone. Screenshots saved to: ${outputDir}`);
})().catch(err => {
  console.error('Capture failed:', err.message);
  process.exit(1);
});
