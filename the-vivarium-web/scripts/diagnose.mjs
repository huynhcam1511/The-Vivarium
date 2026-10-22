import puppeteer from 'puppeteer';

async function diagnose() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check window object or PIXI app
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()),
    };
  });
  console.log('PAGE INFO:', info);

  // Click Thác Nước
  console.log('Clicking Thác Nước...');
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Thác Nước'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Thác Nước result:', clicked);
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
}

diagnose().catch(console.error);
