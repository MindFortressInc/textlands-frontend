const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Set viewport to cover size
  await page.setViewport({ width: 820, height: 360, deviceScaleFactor: 2 });

  // Load the HTML file
  const filePath = path.resolve(__dirname, 'facebook-cover.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');

  // Screenshot just the cover element
  const cover = await page.$('#cover');
  if (cover) {
    await cover.screenshot({
      path: path.resolve(__dirname, 'facebook-cover.png'),
      type: 'png'
    });
    console.log('Screenshot saved to facebook-cover.png (2x resolution for retina)');
  }

  await browser.close();
})();
