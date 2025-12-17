import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Galaxy Note 20'],
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
});

test('SFShop - Sanity Purchase Mobile Legends (STABLE)', async ({ page }) => {

  /* ===============================
     STEP 1 : OPEN HOMEPAGE & PRODUCT
     =============================== */
  await page.goto('https://stg.sfshop.id/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /mobile legends/i }).click();
  await page.getByRole('img', { name: /mobile legend 5 diamonds/i }).click();

  /* ===============================
     STEP 2 : FILL CUSTOMER DATA
     =============================== */
  await page.locator('#playerID input').fill('115383687');
  await page.locator('#zoneID input').fill('2584');
  await page.locator('#email input').fill('bozartandjung@gmail.com');
  await page.locator('#phone input').fill('088110001000');

  /* ===============================
     STEP 3 : PAYMENT SELECTION
     =============================== */
  const paymentImg = page.locator('img[alt*="ximpaysf"]');
  await expect(paymentImg).toBeVisible();
  await paymentImg.click();

  await page.locator('i.icon-00387_02_arrow_down_thin_filled').click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  /* ===============================
     STEP 4 : BAYAR SEKARANG (ANTI STUCK)
     =============================== */
  const payNowBtn = page.getByRole('button', { name: 'Bayar Sekarang' });
  await expect(payNowBtn).toBeVisible({ timeout: 60_000 });

  let triggered = false;
  for (let i = 1; i <= 3; i++) {
    await payNowBtn.click({ force: true });

    const success = await Promise.race([
      page.waitForURL(/payment|otp|order\//, { timeout: 15_000 }).then(() => true),
      page.waitForSelector('button:has-text("Konfirmasi")', { timeout: 15_000 }).then(() => true),
    ]).catch(() => false);

    if (success) {
      triggered = true;
      break;
    }
  }

  if (!triggered) {
    throw new Error('❌ Bayar Sekarang gagal trigger flow');
  }

  /* ===============================
     STEP 5 : KONFIRMASI JIKA ADA
     =============================== */
  const confirmBtn = page.getByRole('button', { name: /konfirmasi/i });

  if (await confirmBtn.isVisible().catch(() => false)) {
    await expect(confirmBtn).toBeEnabled({ timeout: 15_000 });
    await confirmBtn.evaluate(el =>
      el.scrollIntoView({ block: 'center', inline: 'center' })
    );

    try {
      await confirmBtn.evaluate(el => el.click());
    } catch {
      await confirmBtn.click({ force: true });
    }
  }

  /* ===============================
     STEP 6 : WAIT OTP / RESULT PAGE
     =============================== */
  await Promise.race([
    page.waitForURL(/payment\/otp/, { timeout: 90_000 }),
    page.waitForURL(/order\//, { timeout: 90_000 }),
  ]);

  /* ===============================
     STEP 7 : INPUT OTP (SAFE)
     =============================== */
  if (page.url().includes('/payment/otp')) {

    // ❗ JANGAN pakai toHaveCount — ini aman
    const otpInputs = page.locator('input');

    await expect
      .poll(async () => await otpInputs.count(), {
        timeout: 30_000,
      })
      .toBeGreaterThanOrEqual(1);

    const count = await otpInputs.count();
    const otp = ['1', '2', '3', '4'];

    for (let i = 0; i < Math.min(count, otp.length); i++) {
      await otpInputs.nth(i).fill(otp[i]);
    }

    const otpConfirmBtn = page.getByRole('button', { name: /konfirmasi/i });
    if (await otpConfirmBtn.isVisible().catch(() => false)) {
      await expect(otpConfirmBtn).toBeEnabled({ timeout: 10_000 });
      await otpConfirmBtn.click({ force: true });
    }
  }

  /* ===============================
     STEP 8 : ORDER PAGE (FINAL)
     =============================== */
  await page.waitForURL(/\/order\/[a-zA-Z0-9]+/, { timeout: 120_000 });

  const orderUrl = page.url();
  const match = orderUrl.match(/order\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error(`❌ Order ID tidak ditemukan: ${orderUrl}`);
  }

  const orderId = match[1];
  console.log('✅ ORDER ID:', orderId);

  /* ===============================
     STEP 9 : CEK STATUS SAMPAI SELESAI
     =============================== */
  const cekStatusBtn = page.getByRole('button', { name: /cek status/i });
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });

  const start = Date.now();
  while (Date.now() - start < 120_000) {
    if (await backHomeBtn.isVisible().catch(() => false)) break;

    if (await cekStatusBtn.isVisible().catch(() => false)) {
      await cekStatusBtn.click({ force: true });
    }

    await page.waitForTimeout(3_000);
  }

  await expect(backHomeBtn).toBeVisible({ timeout: 10_000 });
  console.log('✅ Button "Kembali Ke Beranda" muncul');

  /* ===============================
     STEP 10 : BACK TO HOME
     =============================== */
  await backHomeBtn.click({ force: true });
  await expect(page).toHaveURL(/stg\.sfshop\.id\/?$/);
});
