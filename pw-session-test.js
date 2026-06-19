// Playwright session screen interaction test
const { chromium } = require('playwright');

const BASE  = 'http://localhost:3000';
const EMAIL = 'playwright@fitnxt.test';
const PASS  = 'PlaywrightTest1!';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('ERR:', msg.text());
  });

  // ── Login ─────────────────────────────────────────────────────
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 12_000 });
  await page.waitForLoadState('networkidle');
  console.log('Logged in.');

  // ── Navigate to /session ──────────────────────────────────────
  await page.locator('a[href="/session"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Screenshot 1: Initial state
  await page.screenshot({ path: '/tmp/s01-session-loaded.png', fullPage: true });
  console.log('s01: Session page loaded');

  // ── Tap Tuesday (day 2) — triggers day-change skeleton bug ───
  const dayTabs = page.locator('[role="tablist"] button');
  const count = await dayTabs.count();
  console.log('Day tabs:', count);

  if (count >= 2) {
    await dayTabs.nth(1).click(); // Tuesday
    // Immediately screenshot to catch any skeleton flash
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/s02-day-change-300ms.png', fullPage: true });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: '/tmp/s03-day-change-settled.png', fullPage: true });
    console.log('s02+s03: Day change captured');
  }

  // ── Tap back to Monday ────────────────────────────────────────
  await dayTabs.nth(0).click(); // Monday
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/s04-back-to-monday.png', fullPage: true });
  console.log('s04: Back to Monday');

  // ── Tap first exercise card → ExerciseDetailSheet ─────────────
  const firstCard = page.locator('[role="button"]').first();
  await firstCard.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/s05-exercise-detail-sheet.png', fullPage: true });
  console.log('s05: Exercise detail sheet');

  // Check if sheet opened
  const sheetVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
  console.log('Sheet dialog visible:', sheetVisible);

  // ── Dismiss sheet by tapping Close ───────────────────────────
  if (sheetVisible) {
    const closeBtn = page.locator('button[aria-label="Close exercise details"]');
    await closeBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '/tmp/s06-sheet-dismissed.png', fullPage: true });
    console.log('s06: Sheet dismissed');
  }

  // ── Swipe-to-remove an exercise card ─────────────────────────
  // Simulate swipe left on first card
  const firstExCard = page.locator('[role="button"]').first();
  const box = await firstExCard.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '/tmp/s07-swipe-remove.png', fullPage: true });
    console.log('s07: Swipe to remove');
  }

  console.log('\nAll screenshots saved to /tmp/s0*.png');
  await page.waitForTimeout(2000);
  await browser.close();
})();
