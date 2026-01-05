/**
 * STEP 2: Reusable Page Actions
 * 
 * Common actions yang dipakai di multiple tests.
 * Benefits:
 * - Menghilangkan code duplication
 * - Built-in retry mechanisms
 * - Consistent error handling
 * - Easier to maintain
 * 
 * Cara pakai:
 * import { fillCustomerData, clickBayarSekarang } from '../helpers/page-actions';
 * await fillCustomerData(page, customer);
 */

import { Page, expect } from '@playwright/test';
import { CustomerData, PaymentMethod, timeouts } from './test-data';

// =========================
// NAVIGATION ACTIONS
// =========================

/**
 * Navigate ke product page
 * 
 * @param page - Playwright page object
 * @param productName - Nama product (e.g., 'Mobile Legends')
 * @param productImageAlt - Alt text dari image (e.g., 'mobile legend 5 diamonds')
 * 
 * Example:
 * await navigateToProduct(page, 'Mobile Legends', 'mobile legend 5 diamonds');
 */
export async function navigateToProduct(
  page: Page, 
  productName: string, 
  productImageAlt: string
) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: new RegExp(productName, 'i') }).click();
  await page.getByRole('img', { name: new RegExp(productImageAlt, 'i') }).click();
  console.log(`✅ Navigated to ${productName} product`);
}

// =========================
// FORM ACTIONS
// =========================

/**
 * Fill customer data form
 * 
 * @param page - Playwright page object
 * @param customerData - Customer data object
 * 
 * Example:
 * const customer = getCustomerData('default');
 * await fillCustomerData(page, customer);
 */
export async function fillCustomerData(page: Page, customerData: CustomerData) {
  await page.locator('#playerID input').fill(customerData.playerId);
  await page.locator('#zoneID input').fill(customerData.zoneId);
  await page.locator('#email input').fill(customerData.email);
  await page.locator('#phone input').fill(customerData.phone);
  console.log(`✅ Customer data filled: ${customerData.email}`);
}

/**
 * Fill OTP inputs
 * 
 * @param page - Playwright page object
 * @param otpValues - Array of OTP values (default: ['1', '2', '3', '4'])
 * 
 * Example:
 * await fillOTP(page, ['1', '2', '3', '4']);
 */
export async function fillOTP(page: Page, otpValues: string[] = ['1', '2', '3', '4']) {
  console.log('🔐 Filling OTP...');
  
  const otpInputs = page.locator('input[type="text"], input[type="tel"], input:not([type])');

  // Wait untuk OTP inputs muncul dengan polling
  await expect
    .poll(async () => await otpInputs.count(), {
      timeout: 30_000,
    })
    .toBeGreaterThanOrEqual(1);

  const count = await otpInputs.count();
  console.log(`📝 Found ${count} OTP input fields`);

  for (let i = 0; i < Math.min(count, otpValues.length); i++) {
    await otpInputs.nth(i).fill(otpValues[i]);
  }

  console.log('✅ OTP filled successfully');
}

// =========================
// PAYMENT ACTIONS
// =========================

/**
 * Select payment method
 * 
 * @param page - Playwright page object
 * @param paymentMethod - Payment method object
 * 
 * Example:
 * const payment = getPaymentMethod('ximpaysf');
 * await selectPaymentMethod(page, payment);
 */
export async function selectPaymentMethod(page: Page, paymentMethod: PaymentMethod) {
  const paymentElement = page.locator(paymentMethod.selector);
  await expect(paymentElement).toBeVisible({ timeout: timeouts.medium });
  await paymentElement.click();
  
  await page.locator('i.icon-00387_02_arrow_down_thin_filled').click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  
  console.log(`✅ Selected payment method: ${paymentMethod.name}`);
}

/**
 * Click "Bayar Sekarang" dengan retry mechanism
 * 
 * Function ini punya built-in retry (3 attempts) untuk handle:
 * - Slow loading
 * - Element overlapping
 * - Network issues
 * 
 * @param page - Playwright page object
 * @param expectedSelectors - Array of selectors yang expected muncul setelah click
 * 
 * Example:
 * await clickBayarSekarang(page, ['button:has-text("Konfirmasi")']);
 */
export async function clickBayarSekarang(
  page: Page, 
  expectedSelectors: string[] = []
) {
  const payNowBtn = page.getByRole('button', { name: 'Bayar Sekarang' });
  await expect(payNowBtn).toBeVisible({ timeout: timeouts.long });

  let triggered = false;
  
  for (let i = 1; i <= 3; i++) {
    await payNowBtn.click({ force: true });

    // Build array of promises untuk race condition
    const waitPromises = [
      page.waitForURL(/payment|otp|order\//, { timeout: timeouts.medium }).then(() => true),
      ...expectedSelectors.map(selector => 
        page.waitForSelector(selector, { timeout: timeouts.medium }).then(() => true)
      ),
    ];

    const success = await Promise.race(waitPromises).catch(() => false);

    if (success) {
      triggered = true;
      console.log(`✅ Bayar Sekarang triggered on attempt ${i}`);
      break;
    }
  }

  if (!triggered) {
    throw new Error('❌ Bayar Sekarang gagal trigger flow setelah 3 attempts');
  }
}

/**
 * Click confirmation button dengan multiple strategies
 * 
 * Function ini pakai 2 strategies:
 * 1. evaluate() - Direct DOM manipulation
 * 2. force click - Kalau evaluate gagal
 * 
 * @param page - Playwright page object
 * @param buttonName - Name dari button (default: 'konfirmasi')
 * 
 * Example:
 * await clickConfirmButton(page, 'konfirmasi');
 * await clickConfirmButton(page, 'lanjutkan pembayaran');
 */
export async function clickConfirmButton(page: Page, buttonName: string = 'konfirmasi') {
  const confirmBtn = page.getByRole('button', { name: new RegExp(buttonName, 'i') });

  if (await confirmBtn.isVisible().catch(() => false)) {
    await expect(confirmBtn).toBeEnabled({ timeout: timeouts.medium });
    await confirmBtn.evaluate(el =>
      el.scrollIntoView({ block: 'center', inline: 'center' })
    );

    try {
      await confirmBtn.evaluate(el => el.click());
      console.log(`✅ ${buttonName} button clicked (evaluate)`);
    } catch {
      await confirmBtn.click({ force: true });
      console.log(`✅ ${buttonName} button clicked (force)`);
    }
  }
}

/**
 * Handle payment simulation (untuk staging environment)
 * 
 * Function ini khusus untuk staging, di production gak akan ada
 * simulate button jadi safe untuk dipanggil
 * 
 * @param page - Playwright page object
 * 
 * Example:
 * await simulatePayment(page);
 */
export async function simulatePayment(page: Page) {
  const simulateBtn = page.getByTestId('simulate-button');
  
  if (await simulateBtn.isVisible().catch(() => false)) {
    await expect(simulateBtn).toBeEnabled({ timeout: timeouts.medium });
    await simulateBtn.click({ force: true });
    console.log('✅ Simulate payment clicked');
    await page.waitForTimeout(3_000);
  }
}

// =========================
// ORDER STATUS ACTIONS
// =========================

/**
 * Wait untuk order page dan extract order ID dari URL
 * 
 * @param page - Playwright page object
 * @returns Order ID string
 * 
 * Example:
 * const orderId = await getOrderId(page);
 * console.log('Order ID:', orderId);
 */
export async function getOrderId(page: Page): Promise<string> {
  await page.waitForURL(/\/order\/[a-zA-Z0-9]+/, { timeout: timeouts.veryLong });

  const orderUrl = page.url();
  const match = orderUrl.match(/order\/([a-zA-Z0-9]+)/);
  
  if (!match) {
    throw new Error(`❌ Order ID tidak ditemukan: ${orderUrl}`);
  }

  const orderId = match[1];
  console.log('✅ ORDER ID:', orderId);
  return orderId;
}

/**
 * Poll order status sampai completion
 * 
 * Function ini akan click "Cek Status" button setiap 3 detik
 * sampai "Kembali Ke Beranda" button muncul
 * 
 * @param page - Playwright page object
 * @param maxDuration - Maximum duration in milliseconds (default: 120_000 = 2 minutes)
 * 
 * Example:
 * await waitForOrderCompletion(page);
 * await waitForOrderCompletion(page, 180_000); // 3 minutes
 */
export async function waitForOrderCompletion(page: Page, maxDuration: number = 120_000) {
  const cekStatusBtn = page.getByRole('button', { name: /cek status/i });
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });

  const start = Date.now();
  let checkCount = 0;
  
  while (Date.now() - start < maxDuration) {
    if (await backHomeBtn.isVisible().catch(() => false)) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`✅ Order selesai setelah ${checkCount} kali cek status (${elapsed}s)`);
      break;
    }

    if (await cekStatusBtn.isVisible().catch(() => false)) {
      await cekStatusBtn.click({ force: true });
      checkCount++;
    }

    await page.waitForTimeout(3_000);
  }

  await expect(backHomeBtn).toBeVisible({ timeout: timeouts.medium });
  console.log('✅ Button "Kembali Ke Beranda" muncul');
}

/**
 * Return to homepage
 * 
 * @param page - Playwright page object
 * 
 * Example:
 * await returnToHomepage(page);
 */
export async function returnToHomepage(page: Page) {
  const backHomeBtn = page.getByRole('button', { name: /kembali ke beranda/i });
  await backHomeBtn.click({ force: true });
  await expect(page).toHaveURL(/stg\.sfshop\.id\/?$/);
  console.log('✅ Returned to homepage');
}

// =========================
// UTILITY ACTIONS
// =========================

/**
 * Close modal kalau ada
 * 
 * @param page - Playwright page object
 * 
 * Example:
 * await closeModalIfExists(page);
 */
export async function closeModalIfExists(page: Page) {
  const modal = page.locator('reach-portal > div > div').first();
  if (await modal.isVisible().catch(() => false)) {
    await modal.click();
    console.log('✅ Modal closed');
  }
}

/**
 * Take screenshot dengan custom name
 * 
 * Useful untuk debugging failed tests
 * 
 * @param page - Playwright page object
 * @param name - Screenshot name
 * 
 * Example:
 * await takeScreenshot(page, 'before-payment');
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`, 
    fullPage: true 
  });
  console.log(`📸 Screenshot saved: ${name}`);
}