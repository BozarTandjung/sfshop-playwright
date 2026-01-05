import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { navigateToProduct, fillCustomerData, selectPaymentMethod, clickBayarSekarang, simulatePayment, getOrderId, waitForOrderCompletion, clickConfirmButton } from '../helpers/page-actions';
import { getPaymentMethod, getProduct, CustomerData } from '../helpers/test-data';

/* =====================
   STEP 1: CSV TYPE
   ===================== */
interface TestData {
  testName: string;
  type: 'positive' | 'negative';
  playerID: string;
  zoneID: string;
  email: string;
  phone: string;
  expectedError?: string;
}

/* =====================
   STEP 2: READ CSV
   ===================== */
function readCSV(fileName: string): TestData[] {
  const filePath = path.resolve(__dirname, 'data', fileName);
  const content = fs.readFileSync(filePath, 'utf-8');

  const [header, ...rows] = content
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const keys = header.split(',').map(h => h.trim());

  return rows.map(row => {
    const values = row.split(',').map(v => v.trim());
    const record: any = {};

    keys.forEach((key, i) => {
      record[key] = values[i] ?? '';
    });

    return record as TestData;
  });
}

const testData = readCSV('xendit-qris-test.csv');
const payment = getPaymentMethod('xenditQris');
const product = getProduct('mobileLegends');

/* =====================
   STEP 3: GENERATE TEST
   ===================== */
for (const data of testData) {

  test(`[${data.type.toUpperCase()}] ${data.testName}`, async ({ page }) => {
    test.setTimeout(10 * 60 * 1000); // 10 minutes for positive cases

    /* =====================
       STEP 4: TEST FLOW
       ===================== */
    
    // Navigate to product
    await navigateToProduct(page, product.name, '25\\+3 diamonds');

    // Fill customer data
    const customerData: CustomerData = {
      playerId: data.playerID,
      zoneId: data.zoneID,
      email: data.email,
      phone: data.phone,
    };
    await fillCustomerData(page, customerData);

    if (data.type === 'negative') {
      // For negative tests, try to proceed and validate error messages
      const lanjutBtn = page.getByRole('button', { name: /lanjutkan/i });
      await lanjutBtn.click();

      /* =====================
         STEP 5: NEGATIVE ASSERT
         ===================== */
      const errorLocator = page.locator(
        `text=/${data.expectedError}|wajib|invalid|salah|format/i`
      );

      await expect(errorLocator.first()).toBeVisible({ timeout: 15_000 });
      console.log(`✅ Error validation passed: ${data.expectedError}`);
      return;
    }

    /* =====================
       STEP 5: POSITIVE TEST FLOW
       ===================== */
    
    // Select payment method
    await selectPaymentMethod(page, payment);
    
    // Wait for page to settle (important to avoid stuck)
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // Wait for Bayar Sekarang button to be visible before clicking
    const bayarBtn = page.getByRole('button', { name: 'Bayar Sekarang' });
    await expect(bayarBtn).toBeVisible({ timeout: 30_000 });

    // Click Bayar Sekarang with retry logic
    let triggered = false;
    for (let i = 1; i <= 3; i++) {
      console.log(`🔄 Attempt ${i}: Klik Bayar Sekarang...`);
      await bayarBtn.click({ force: true });

      // Wait for transition to payment page or xendit
      const success = await Promise.race([
        page.waitForURL(/\/payment\/menunggu-pembayaran/, { timeout: 15_000 }).then(() => true),
        page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15_000 }).then(() => true),
      ]).catch(() => false);

      if (success) {
        triggered = true;
        break;
      }
    }

    if (!triggered) {
      throw new Error('❌ Gagal trigger pembayaran setelah 3 kali mencoba.');
    }

    // Continue payment and simulate
    const lanjutBayarBtn = page.getByRole('button', { name: 'Lanjutkan Pembayaran' });
    if (await lanjutBayarBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await lanjutBayarBtn.click();
    }
    
    // Wait for Xendit checkout page
    await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 45_000 });
    
    // Simulate payment (using helper function with built-in error handling)
    await simulatePayment(page);

    // Wait for order page and extract order ID
    await page.waitForURL(/\/order\//, { timeout: 60_000, waitUntil: 'domcontentloaded' });
    
    const orderId = await getOrderId(page);
    console.log(`✅ Order ID extracted: ${orderId}`);

    // Wait for order to complete
    await waitForOrderCompletion(page, 120_000);
    console.log('✅ Order completed successfully');

    /* =====================
       STEP 6: POSITIVE ASSERT
       ===================== */
    // Verify we're on order page with valid order ID
    await expect(page).toHaveURL(/\/order\/[a-zA-Z0-9]+/);
    console.log(`✅ Test passed: Order ${orderId} created successfully`);
  });
}

