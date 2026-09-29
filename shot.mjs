import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
  headless: 'new',
  args: ['--no-sandbox'],
});

const viewports = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `/tmp/home_${name}.png`, fullPage: true });
  await page.close();
}

// About page + a couple more
for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto('http://localhost:4173/about', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `/tmp/about_${name}.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log('done');
