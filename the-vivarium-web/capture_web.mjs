import puppeteer from 'puppeteer';

async function capture() {
  console.log('Connecting to localhost:2000 via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:2000', { waitUntil: 'networkidle0' });

  // 1. Overview shot
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: 'C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/web_vivarium_1_overview.png',
  });
  console.log('Saved: web_vivarium_1_overview.png');

  // 2. Click Cây cổ thụ / Canopy view
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const canopy = btns.find(b => b.textContent?.includes('Cây cổ thụ'));
    if (canopy) canopy.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({
    path: 'C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/web_vivarium_3_canopy.png',
  });
  console.log('Saved: web_vivarium_3_canopy.png');

  // 3. Jump to Tổ kiến (Queen chamber closeup)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const form = btns.find(b => b.textContent?.includes('Tổ kiến'));
    if (form) form.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({
    path: 'C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/web_vivarium_4_formicarium.png',
  });
  console.log('Saved: web_vivarium_4_formicarium.png');

  // 4. Select Đào (Dig) and perform interactive dig
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dig = btns.find(b => b.textContent?.includes('Đào'));
    if (dig) dig.click();
  });
  // Click subterranean area
  await page.mouse.click(640, 450);
  await page.mouse.click(672, 450);
  await page.mouse.click(704, 450);
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({
    path: 'C:/Users/ADMIN-PC/.gemini/antigravity/brain/62e7cefe-a2ad-4fd1-ab1c-53e2bb5d0810/web_vivarium_2_digging.png',
  });
  console.log('Saved: web_vivarium_2_digging.png');

  await browser.close();
  console.log('All captures successful!');
}

capture().catch((err) => {
  console.error('Puppeteer capture error:', err);
  process.exit(1);
});
