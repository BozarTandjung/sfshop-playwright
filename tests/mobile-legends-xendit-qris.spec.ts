import { test, expect } from '@playwright/test';

test('SFShop - MLBB QRIS Xendit (Handle Transaction Detail Page)', async ({ page }) => {
  // Global timeout untuk flow pembayaran
  test.setTimeout(5 * 60 * 1000);

  // ================= STEP 1 : NAVIGASI & PRODUK =================
  await page.goto('https://stg.sfshop.id/');
  await page.getByRole('link', { name: 'Mobile Legends Mobile Legends' }).click();
  await page.getByRole('img', { name: 'Mobile Legend 5 Diamonds' }).click();

  // ================= STEP 2 : DATA CUSTOMER =================
  await page.locator('#playerID').getByRole('textbox').fill('115383687');
  await page.locator('#zoneID').getByRole('textbox').fill('2584');
  await page.locator('#email').getByRole('textbox').fill('bozartandjung@gmail.com');
  await page.locator('#phone').getByRole('textbox').fill('088110001000');

  // ================= STEP 3 : PEMILIHAN PEMBAYARAN =================
  await page.getByRole('button', { 
    name: 'https://custinfo.smartfren.com/assembly/uat/payment-aggr/cdn/static/xenditqris/' 
  }).click();
  
  // Handle arrow down jika muncul
  const arrowDown = page.locator('.sc-guDMob.eIgeNF.icon.icon-00387_02_arrow_down_thin_filled');
  if (await arrowDown.isVisible().catch(() => false)) {
    await arrowDown.click();
    console.log('✅ Arrow down diklik');
  }

  // ================= STEP 4 : KLIK LANJUTKAN =================
  const lanjutkanBtn = page.getByRole('button', { name: 'Lanjutkan' });
  await expect(lanjutkanBtn).toBeVisible({ timeout: 10_000 });
  
  console.log('📍 URL sebelum klik Lanjutkan:', page.url());
  await lanjutkanBtn.click();

  // Tunggu proses
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2_000);

  console.log('📍 URL setelah klik Lanjutkan:', page.url());

  // ================= STEP 5 : BAYAR SEKARANG =================
  const bayarSekarang = page.getByRole('button', { name: 'Bayar Sekarang' });
  
  await expect(bayarSekarang).toBeVisible({ timeout: 30_000 });
  console.log('✅ Tombol "Bayar Sekarang" terdeteksi');

  // Retry logic untuk klik Bayar Sekarang
  let paymentTriggered = false;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`🔄 Attempt ${attempt}: Klik Bayar Sekarang...`);
    
    await bayarSekarang.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
    await bayarSekarang.click({ force: true });

    // Tunggu salah satu indikator muncul
    const success = await Promise.race([
      page.waitForURL(/order|payment|xendit|checkout\/payment/, { timeout: 15_000 }).then(() => true),
      page.waitForTimeout(15_000).then(() => false),
    ]).catch(() => false);

    if (success) {
      paymentTriggered = true;
      console.log(`✅ Payment flow triggered pada attempt ${attempt}`);
      console.log('📍 URL setelah Bayar Sekarang:', page.url());
      break;
    }
    
    console.log(`⚠️ Attempt ${attempt}: Waiting for redirect...`);
  }

  if (!paymentTriggered) {
    await page.screenshot({ path: 'debug-bayar-sekarang-failed.png', fullPage: true });
    console.log('📍 Current URL:', page.url());
    console.log('⚠️ No redirect detected, continuing...');
  }

  // ================= STEP 6 : HANDLE BERBAGAI KEMUNGKINAN HALAMAN =================
  console.log('📍 Checking current page state...');
  console.log('URL:', page.url());
  
  // Tunggu halaman stabil
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(3_000);

  // Screenshot untuk debugging
  await page.screenshot({ path: 'debug-after-bayar-sekarang.png', fullPage: true });

  // Cek berbagai kemungkinan elemen yang bisa muncul
  const possibleSelectors = [
    // Simulator Xendit
    page.getByTestId('simulate-button'),
    page.locator('button:has-text("Simulate")'),
    page.locator('button:has-text("simulate")'),
    page.locator('[data-testid*="simulate"]'),
    
    // Halaman instruksi
    page.getByRole('button', { name: /lanjutkan pembayaran/i }),
    page.locator('button:has-text("Lanjutkan Pembayaran")'),
    
    // QR Code page
    page.locator('[class*="qr"]'),
    page.locator('img[alt*="QR"]'),
    
    // Order page langsung
    page.getByRole('button', { name: /cek status/i }),
    
    // Payment confirmation
    page.locator('button:has-text("Konfirmasi")'),
  ];

  // Cari elemen yang visible
  let foundElement = null;
  let elementType = '';

  for (const selector of possibleSelectors) {
    if (await selector.isVisible().catch(() => false)) {
      foundElement = selector;
      const textContent = await selector.textContent().catch(() => null);
      elementType = textContent || 'Unknown';
      console.log(`✅ Found element: ${elementType}`);
      break;
    }
  }

  if (!foundElement) {
    console.log('⚠️ No expected element found, checking page content...');
    const bodyText = await page.locator('body').textContent().catch(() => null);
    console.log('Page content preview:', bodyText?.substring(0, 500) || 'No content available');
    await page.screenshot({ path: 'debug-no-element-found.png', fullPage: true });
  }

  // ================= STEP 7 : HANDLE INSTRUKSI PAGE (JIKA ADA) =================
  const lanjutPembayaran = page.getByRole('button', { name: /lanjutkan pembayaran/i });
  
  if (await lanjutPembayaran.isVisible().catch(() => false)) {
    console.log('📍 Halaman instruksi terdeteksi, klik Lanjutkan Pembayaran...');
    await lanjutPembayaran.click();
    await page.waitForTimeout(3_000);
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log('📍 URL setelah instruksi:', page.url());
  }

  // ================= STEP 8 : SIMULASI PEMBAYARAN (XENDIT) =================
  // Coba berbagai selector untuk simulate button
  const simulateSelectors = [
    page.getByTestId('simulate-button'),
    page.locator('button:has-text("Simulate")'),
    page.locator('button:has-text("simulate")'),
    page.locator('[data-testid*="simulate"]'),
    page.locator('button[class*="simulate"]'),
    page.locator('//button[contains(text(), "Simulate")]'),
  ];

  let simulateBtn = null;
  
  for (const selector of simulateSelectors) {
    try {
      await selector.waitFor({ timeout: 10_000 });
      if (await selector.isVisible()) {
        simulateBtn = selector;
        console.log('✅ Simulate button found with selector');
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (simulateBtn) {
    console.log('📍 Masuk ke Simulator Xendit');
    console.log('URL simulator:', page.url());
    
    await simulateBtn.click({ force: true });
    console.log('✅ Tombol Simulate diklik');
    
    // Tunggu proses simulasi
    await page.waitForTimeout(5_000);
  } else {
    console.log('⚠️ Simulate button tidak ditemukan');
    console.log('📍 Current URL:', page.url());
    await page.screenshot({ path: 'debug-no-simulate-button.png', fullPage: true });
    
    // Jika tidak ada simulate button, mungkin langsung ke order page
    // atau payment sudah otomatis processed
    console.log('ℹ️ Melanjutkan ke step berikutnya...');
  }

  // ================= STEP 9 : TUNGGU HALAMAN ORDER =================
  console.log('⏳ Menunggu halaman order...');
  
  // Coba tunggu URL /order/ atau elemen khas order page
  const orderPageReached = await Promise.race([
    page.waitForURL(/\/order\//, { timeout: 60_000 }).then(() => true),
    page.getByRole('button', { name: /cek status/i }).waitFor({ timeout: 60_000 }).then(() => true),
    page.getByRole('button', { name: /kembali ke beranda/i }).waitFor({ timeout: 60_000 }).then(() => true),
  ]).catch(() => false);

  if (!orderPageReached) {
    console.log('⚠️ Tidak sampai ke order page dalam waktu yang ditentukan');
    console.log('📍 Current URL:', page.url());
    await page.screenshot({ path: 'debug-order-page-timeout.png', fullPage: true });
  } else {
    console.log('✅ Order page reached');
    console.log('📍 URL:', page.url());
  }

  // ================= STEP 10 : CEK STATUS SAMPAI SELESAI =================
  const cekStatusBtn = page.getByRole('button', { name: /cek status/i });
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });

  const startTime = Date.now();
  const maxDuration = 120_000; // 2 menit timeout
  let checkCount = 0;
  
  console.log('🔄 Memulai polling status pembayaran...');
  
  while (Date.now() - startTime < maxDuration) {
    // Cek apakah tombol "Kembali Ke Beranda" sudah muncul (indikasi sukses)
    if (await backHomeBtn.isVisible().catch(() => false)) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Order selesai setelah ${checkCount} kali cek status (${elapsedTime}s)`);
      break;
    }

    // Jika tombol "Cek Status" ada, klik untuk refresh status
    if (await cekStatusBtn.isVisible().catch(() => false)) {
      checkCount++;
      console.log(`🔄 Polling #${checkCount}: Menekan tombol Cek Status...`);
      await cekStatusBtn.click({ force: true });
    }

    // Tunggu 3 detik sebelum cek lagi
    await page.waitForTimeout(3_000);
  }

  // Validasi final bahwa tombol "Kembali Ke Beranda" muncul
  await expect(backHomeBtn).toBeVisible({ timeout: 10_000 });
  console.log('✅ Button "Kembali Ke Beranda" terdeteksi');

  // ================= STEP 11 : SELESAI & KEMBALI =================
  await backHomeBtn.click();
  await expect(page).toHaveURL(/stg\.sfshop\.id\/?$/);
  
  console.log('🎉 Transaksi Berhasil dan Kembali ke Beranda.');
});