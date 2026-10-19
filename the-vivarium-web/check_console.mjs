import puppeteer from 'puppeteer';

async function check() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:2000', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 2000));
  await browser.close();
}

check().catch(console.error);
