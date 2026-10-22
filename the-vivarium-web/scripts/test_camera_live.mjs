import puppeteer from 'puppeteer';

async function testCameraLive() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  await page.goto('http://127.0.0.1:2019/?mode=aquatic', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check what happens when clicking buttons
  const clickAndCheck = async (buttonText) => {
    const clicked = await page.evaluate((txt) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(txt));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, buttonText);
    await new Promise(r => setTimeout(r, 500));
    return clicked;
  };

  console.log('Click LAKE:', await clickAndCheck('Lòng Hồ'));
  console.log('Click WATERFALL:', await clickAndCheck('Thác Nước'));
  console.log('Click OVERVIEW:', await clickAndCheck('Toàn Cảnh'));

  await browser.close();
}

testCameraLive().catch(console.error);
