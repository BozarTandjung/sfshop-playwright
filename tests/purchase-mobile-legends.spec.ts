import { test, expect } from '@playwright/test';

/**
 * Test: Mobile Legends Purchase with XimpaySF Virtual Account
 * 
 * This test runs on ALL projects defined in playwright.config.ts:
 * - mobile-chromium (Galaxy Note 20)
 * - mobile-firefox
 * - desktop-chromium
 * - desktop-firefox
 */

test('SFShop - Purchase Mobile Legends with XimpaySF', async ({ page }) => {

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

  /* ===============================
     STEP 3 : PAYMENT SELECTION (XIMPAYSF)
     =============================== */
  console.log('📍 STEP 3: Selecting XimpaySF payment...');
  console.log(`📍 Current URL: ${page.url()}`);
  
  try {
    const paymentImg = page.locator('img[alt*="ximpaysf"]');
    await expect(paymentImg).toBeVisible({ timeout: 10_000 });
    await paymentImg.click();
    console.log('✅ XimpaySF payment selected');

    const arrowDown = page.locator('i.icon-00387_02_arrow_down_thin_filled');
    if (await arrowDown.isVisible().catch(() => false)) {
      await arrowDown.click();
      console.log('✅ Arrow down clicked');
    }

    const lanjutkanBtn = page.getByRole('button', { name: 'Lanjutkan' });
    await lanjutkanBtn.click();
    console.log('✅ Lanjutkan button clicked');
    console.log(`📍 URL after Lanjutkan: ${page.url()}`);
    
    // Tunggu halaman stabil
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2_000);
    console.log(`📍 URL after network idle: ${page.url()}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in STEP 3:', errorMessage);
    await page.screenshot({ path: 'debug-step3-payment-selection-failed.png', fullPage: true });
    throw error;
  }

  /* ===============================
     STEP 4 : BAYAR SEKARANG (ANTI STUCK)
     =============================== */
  console.log('📍 STEP 4: Clicking Bayar Sekarang...');
  console.log(`📍 Current URL: ${page.url()}`);
  
  const payNowBtn = page.getByRole('button', { name: 'Bayar Sekarang' });
  
  try {
    await expect(payNowBtn).toBeVisible({ timeout: 60_000 });
    console.log('✅ Bayar Sekarang button visible');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Bayar Sekarang button not found');
    await page.screenshot({ path: 'debug-step4-bayar-sekarang-not-found.png', fullPage: true });
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get content');
    console.log('📄 Page content preview:', bodyText?.substring(0, 500) || 'No content');
    throw error;
  }

  let triggered = false;
  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 Attempt ${i}: Clicking Bayar Sekarang...`);
    await payNowBtn.click({ force: true });

    const success = await Promise.race([
      page.waitForURL(/payment|otp|order\//, { timeout: 15_000 }).then(() => true),
      page.waitForSelector('button:has-text("Konfirmasi")', { timeout: 15_000 }).then(() => true),
    ]).catch(() => false);

    if (success) {
      triggered = true;
      console.log(`✅ Bayar Sekarang triggered on attempt ${i}`);
      console.log(`📍 URL after Bayar Sekarang: ${page.url()}`);
      break;
    } else {
      console.log(`⚠️ Attempt ${i} failed, URL still: ${page.url()}`);
      if (i === 3) {
        await page.screenshot({ path: 'debug-step4-bayar-sekarang-all-attempts-failed.png', fullPage: true });
      }
    }
  }

  if (!triggered) {
    console.error('❌ Bayar Sekarang gagal trigger flow setelah 3 attempts');
    console.log(`📍 Final URL: ${page.url()}`);
    throw new Error('❌ Bayar Sekarang gagal trigger flow setelah 3 attempts');
  }

  /* ===============================
     STEP 5 : KONFIRMASI JIKA ADA
     =============================== */
  console.log('📍 STEP 5: Checking for Konfirmasi button...');
  console.log(`📍 Current URL: ${page.url()}`);
  
  const confirmBtn = page.getByRole('button', { name: /konfirmasi/i });

  if (await confirmBtn.isVisible().catch(() => false)) {
    console.log('✅ Konfirmasi button detected');
    
    try {
      await expect(confirmBtn).toBeEnabled({ timeout: 15_000 });
      await confirmBtn.evaluate((el: HTMLElement) =>
        el.scrollIntoView({ block: 'center', inline: 'center' })
      );

      try {
        await confirmBtn.evaluate((el: HTMLElement) => el.click());
        console.log('✅ Konfirmasi button clicked (evaluate)');
      } catch {
        await confirmBtn.click({ force: true });
        console.log('✅ Konfirmasi button clicked (force)');
      }
      
      console.log(`📍 URL after Konfirmasi: ${page.url()}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error clicking Konfirmasi:', errorMessage);
      await page.screenshot({ path: 'debug-step5-konfirmasi-failed.png', fullPage: true });
      throw error;
    }
  } else {
    console.log('ℹ️ No Konfirmasi button found, continuing...');
  }

  /* ===============================
     STEP 6 : WAIT OTP / RESULT PAGE
     =============================== */
  console.log('📍 STEP 6: Waiting for OTP or Order page...');
  
  try {
    await Promise.race([
      page.waitForURL(/payment\/otp/, { timeout: 90_000 }),
      page.waitForURL(/order\//, { timeout: 90_000 }),
    ]);

    console.log(`✅ Redirected to: ${page.url()}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Timeout waiting for OTP or Order page');
    console.log(`📍 Current URL: ${page.url()}`);
    await page.screenshot({ path: 'debug-step6-redirect-timeout.png', fullPage: true });
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get content');
    console.log('📄 Page content preview:', bodyText?.substring(0, 500) || 'No content');
    throw error;
  }

  /* ===============================
     STEP 7 : INPUT OTP (SAFE)
     =============================== */
  if (page.url().includes('/payment/otp')) {
    console.log('🔐 STEP 7: OTP page detected, filling OTP...');
    console.log(`📍 Current URL: ${page.url()}`);

    try {
      const otpInputs = page.locator('input[type="text"], input[type="tel"], input:not([type])');

      await expect
        .poll(async () => await otpInputs.count(), {
          timeout: 30_000,
        })
        .toBeGreaterThanOrEqual(1);

      const count = await otpInputs.count();
      const otp = ['1', '2', '3', '4'];

      console.log(`📝 Found ${count} OTP input fields`);

      for (let i = 0; i < Math.min(count, otp.length); i++) {
        await otpInputs.nth(i).fill(otp[i]);
        console.log(`✅ OTP digit ${i + 1} filled`);
      }

      console.log('✅ OTP filled successfully');

      const otpConfirmBtn = page.getByRole('button', { name: /konfirmasi/i });
      if (await otpConfirmBtn.isVisible().catch(() => false)) {
        await expect(otpConfirmBtn).toBeEnabled({ timeout: 10_000 });
        await otpConfirmBtn.click({ force: true });
        console.log('✅ OTP Konfirmasi clicked');
        console.log(`📍 URL after OTP Konfirmasi: ${page.url()}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in OTP step:', errorMessage);
      await page.screenshot({ path: 'debug-step7-otp-failed.png', fullPage: true });
      throw error;
    }
  } else {
    console.log('ℹ️ No OTP page detected, skipping OTP step');
  }

  /* ===============================
     STEP 8 : ORDER PAGE (FINAL)
     =============================== */
  console.log('📍 STEP 8: Waiting for Order page...');
  
  try {
    await page.waitForURL(/\/order\/[a-zA-Z0-9]+/, { timeout: 120_000 });
    console.log(`✅ Order page reached: ${page.url()}`);

    const orderUrl = page.url();
    const match = orderUrl.match(/order\/([a-zA-Z0-9]+)/);
    if (!match) {
      await page.screenshot({ path: 'debug-step8-invalid-order-url.png', fullPage: true });
      throw new Error(`❌ Order ID tidak ditemukan: ${orderUrl}`);
    }

    const orderId = match[1];
    console.log('✅ ORDER ID:', orderId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error reaching Order page:', errorMessage);
    console.log(`📍 Current URL: ${page.url()}`);
    await page.screenshot({ path: 'debug-step8-order-page-timeout.png', fullPage: true });
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get content');
    console.log('📄 Page content preview:', bodyText?.substring(0, 500) || 'No content');
    throw error;
  }

  /* ===============================
     STEP 9 : CEK STATUS SAMPAI SELESAI
     =============================== */
  console.log('📍 STEP 9: Polling order status...');
  console.log(`📍 Current URL: ${page.url()}`);
  
  const cekStatusBtn = page.getByRole('button', { name: /cek status/i });
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });

  const start = Date.now();
  let checkCount = 0;
  
  try {
    while (Date.now() - start < 120_000) {
      if (await backHomeBtn.isVisible().catch(() => false)) {
        const elapsed = Math.round((Date.now() - start) / 1000);
        console.log(`✅ Order selesai setelah ${checkCount} kali cek status (${elapsed}s)`);
        break;
      }

      if (await cekStatusBtn.isVisible().catch(() => false)) {
        checkCount++;
        console.log(`🔄 Polling #${checkCount}: Menekan tombol Cek Status...`);
        await cekStatusBtn.click({ force: true });
      }

      await page.waitForTimeout(3_000);
    }

    await expect(backHomeBtn).toBeVisible({ timeout: 10_000 });
    console.log('✅ Button "Kembali Ke Beranda" muncul');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during status polling:', errorMessage);
    console.log(`📍 Current URL: ${page.url()}`);
    console.log(`📊 Total checks performed: ${checkCount}`);
    await page.screenshot({ path: 'debug-step9-polling-failed.png', fullPage: true });
    const bodyText = await page.locator('body').textContent().catch(() => 'Unable to get content');
    console.log('📄 Page content preview:', bodyText?.substring(0, 500) || 'No content');
    throw error;
  }

  /* ===============================
     STEP 10 : BACK TO HOME
     =============================== */
  console.log('📍 STEP 10: Returning to homepage...');
  console.log(`📍 Current URL before click: ${page.url()}`);
  
  try {
    await backHomeBtn.click({ force: true });
    await expect(page).toHaveURL(/stg\.sfshop\.id\/?$/);
    console.log(`✅ Returned to homepage: ${page.url()}`);
    console.log('🎉 Test XimpaySF completed successfully!');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error returning to homepage:', errorMessage);
    console.log(`📍 Current URL: ${page.url()}`);
    await page.screenshot({ path: 'debug-step10-return-home-failed.png', fullPage: true });
    throw error;
  }
});