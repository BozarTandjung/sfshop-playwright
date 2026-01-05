import { test, expect } from '@playwright/test';

test('SFShop - MLBB QRIS Xendit (Stable & Robust Version)', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

 /* ===============================
     STEP 1 : OPEN HOMEPAGE & PRODUCT
     =============================== */
  console.log('📍 STEP 1: Navigating to homepage...');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  console.log(`📍 URL after goto: ${page.url()}`);
  
  try {
    await page.getByRole('link', { name: /mobile legends/i }).click();
    console.log('✅ Mobile Legends link clicked');
    console.log(`📍 URL after ML click: ${page.url()}`);
    
    await page.getByRole('img', { name: /25\+3 diamonds/i }).click();
    console.log('✅ 25+3 Diamonds product selected');
    console.log(`📍 URL after product selection: ${page.url()}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in STEP 1:', errorMessage);
    await page.screenshot({ path: 'debug-step1-navigation-failed.png', fullPage: true });
    throw error;
  }

  /* ===============================
     STEP 2 : FILL CUSTOMER DATA
     =============================== */
  console.log('📍 STEP 2: Filling customer data...');
  try {
    await page.locator('#playerID input').fill('115383687');
    console.log('✅ Player ID filled');
    
    await page.locator('#zoneID input').fill('2584');
    console.log('✅ Zone ID filled');
    
    await page.locator('#email input').fill('bozartandjung@gmail.com');
    console.log('✅ Email filled');
    
    await page.locator('#phone input').fill('088110001000');
    console.log('✅ Phone filled');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in STEP 2:', errorMessage);
    await page.screenshot({ path: 'debug-step2-form-fill-failed.png', fullPage: true });
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get page content');
    console.log('📄 Page content preview:', bodyText?.substring(0, 300) || 'No content');
    throw error;
  }

  // ================= STEP 3 : PEMILIHAN PEMBAYARAN =================
  await page.getByRole('button', { name: /xenditqris/i }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  // MEMBERI WAKTU SETTLING (Penting agar tidak stuck di Step 4)
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2000); 

  // ================= STEP 4 : BAYAR SEKARANG (DENGAN RETRY LOGIC) =================
  const bayarBtn = page.getByRole('button', { name: 'Bayar Sekarang' });
  await expect(bayarBtn).toBeVisible({ timeout: 30_000 });

  let triggered = false;
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 Attempt ${i}: Klik Bayar Sekarang...`);
    await bayarBtn.click({ force: true });

    // Tunggu transisi ke halaman instruksi atau xendit
    const success = await Promise.race([
      page.waitForURL(/\/payment\/menunggu-pembayaran/, { timeout: 15_000 }).then(() => true),
      page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15_000 }).then(() => true),
    ]).catch(() => false);

    if (success) {
      triggered = true;
      break;
    }
  }

  if (!triggered) throw new Error("❌ Gagal trigger pembayaran setelah 3 kali mencoba.");

  // ================= STEP 5 : INSTRUKSI & SIMULATOR =================
  const lanjutBayarBtn = page.getByRole('button', { name: 'Lanjutkan Pembayaran' });
  if (await lanjutBayarBtn.isVisible().catch(() => false)) {
    await lanjutBayarBtn.click();
  }

  await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 45_000 });
  const simulateBtn = page.getByTestId('simulate-button');
  await expect(simulateBtn).toBeVisible({ timeout: 20_000 });
  await simulateBtn.click({ force: true });

  // ================= STEP 6 : POLLING STATUS (STEP 9-11 VERSI MODERN) =================
  await page.waitForURL(/\/order\//, { timeout: 60_000, waitUntil: 'domcontentloaded' });

  const cekStatusBtn = page.getByRole('button', { name: /cek status/i });
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });

  // Ini adalah pengganti Step 9, 10, dan 11 Anda dalam bentuk yang lebih stabil
  await expect.poll(async () => {
    if (await cekStatusBtn.isVisible()) {
      await cekStatusBtn.click({ force: true });
    }
    return await backHomeBtn.isVisible();
  }, {
    message: 'Menunggu status sukses (Tombol Kembali ke Beranda muncul)',
    timeout: 120_000,
    intervals: [3000], 
  }).toBe(true);

  // ================= FINAL STEP =================
  await backHomeBtn.click();
  await expect(page).toHaveURL(/stg\.sfshop\.id\/?$/);
  console.log('🎉 Transaksi QRIS Sukses!');
});