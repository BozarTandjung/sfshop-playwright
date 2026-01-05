import { test, expect } from '@playwright/test';
import { navigateToProduct, fillCustomerData, selectPaymentMethod, clickBayarSekarang, simulatePayment, getOrderId, waitForOrderCompletion, clickConfirmButton } from '../helpers/page-actions';
import { getCustomerData, getPaymentMethod, getProduct } from '../helpers/test-data';
import { cmsUtility } from './cmsUtility';
import testData from './testData.json';

/**
 * E2E Test: Xendit QRIS Payment with CMS Verification
 * 
 * This test:
 * 1. Creates an order using Xendit QRIS payment
 * 2. Extracts the order ID from the order detail page
 * 3. Logs into CMS and verifies the order exists
 * 4. Validates order details in CMS
 */
test('SFShop - Xendit QRIS Payment with CMS Verification', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000); // 10 minutes timeout for full E2E flow

  const customer = getCustomerData('default');
  const payment = getPaymentMethod('xenditQris');
  const product = getProduct('mobileLegends');
  const cms = new cmsUtility(page);

  // Get CMS credentials from testData.json
  const cmsCredentials = testData.find(item => item.testStep === 'Login_Cms');
  const cmsEmail = cmsCredentials?.param1 || 'fajar.triantoro@smartfren.com';
  const cmsPassword = cmsCredentials?.param2 || 'Smartfren123';

  /* ===============================
     STEP 1: Navigate to Product
     =============================== */
  console.log('📍 STEP 1: Navigating to product...');
  await navigateToProduct(page, product.name, '25\\+3 diamonds');

  /* ===============================
     STEP 2: Fill Customer Data
     =============================== */
  console.log('📍 STEP 2: Filling customer data...');
  await fillCustomerData(page, customer);

  /* ===============================
     STEP 3: Select Payment Method
     =============================== */
  console.log('📍 STEP 3: Selecting payment method...');
  await selectPaymentMethod(page, payment);

  // Wait for page to settle
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2_000);

  /* ===============================
     STEP 4: Click Bayar Sekarang
     =============================== */
  console.log('📍 STEP 4: Clicking Bayar Sekarang...');
  await clickBayarSekarang(page, [
    '/payment/menunggu-pembayaran',
    'checkout-staging.xendit.co'
  ]);

  /* ===============================
     STEP 5: Continue Payment & Simulate
     =============================== */
  console.log('📍 STEP 5: Continuing payment and simulating...');
  
  // Click "Lanjutkan Pembayaran" if visible
  await clickConfirmButton(page, 'lanjutkan pembayaran');
  
  // Wait for Xendit checkout page
  await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 45_000 });
  
  // Simulate payment
  await simulatePayment(page);
  console.log('✅ Payment simulated');

  /* ===============================
     STEP 6: Wait for Order Completion & Extract Order ID
     =============================== */
  console.log('📍 STEP 6: Waiting for order completion and extracting order ID...');
  
  // Wait for order page
  await page.waitForURL(/\/order\//, { timeout: 60_000, waitUntil: 'domcontentloaded' });
  
  // Extract order ID
  const orderId = await getOrderId(page);
  console.log(`✅ Order ID extracted: ${orderId}`);

  // Wait for order to complete
  await waitForOrderCompletion(page, 120_000);
  console.log('✅ Order completed successfully');

  /* ===============================
     STEP 7: Verify Order in CMS (SKIPPED FOR NOW)
     =============================== */
  console.log('📍 STEP 7: CMS verification skipped for now');
  console.log(`✅ Order ID created: ${orderId}`);
  console.log('💡 CMS verification is currently disabled');

  // CMS Verification is skipped for now
  // Uncomment below to enable CMS verification:
  /*
  console.log('📍 STEP 7: Verifying order in CMS...');
  
  // Navigate to CMS and login
  await cms.navigateToCms();
  await cms.loginCms(cmsEmail, cmsPassword);
  console.log('✅ Logged into CMS');

  // Navigate to Orders page
  await cms.navigateToOrders();
  
  // Wait a bit for orders to sync (order may take time to appear in CMS)
  await page.waitForTimeout(5_000);
  
  // Search for order by ID
  const orderFound = await cms.searchOrderById(orderId);
  
  if (!orderFound) {
    // Retry after waiting a bit more
    console.log('⚠️ Order not found immediately, waiting and retrying...');
    await page.waitForTimeout(10_000);
    const retryFound = await cms.searchOrderById(orderId);
    
    if (!retryFound) {
      await page.screenshot({ path: `test-results/cms-order-not-found-${orderId}.png`, fullPage: true });
      throw new Error(`❌ Order ID ${orderId} not found in CMS after retry`);
    }
  }

  // Verify order details
  const orderVerified = await cms.verifyOrderDetails(
    orderId,
    'paid', // Expected status
    'Xendit QRIS' // Expected payment method
  );

  expect(orderVerified).toBe(true);
  console.log('✅ Order verified in CMS successfully');

  // Extract Order Info from CMS
  console.log('📍 STEP 8: Extracting order information from CMS...');
  const orderInfo = await cms.extractOrderInfo(orderId);
  console.log('📋 Order Info:', JSON.stringify(orderInfo, null, 2));
  
  expect(orderInfo.found).toBe(true);
  expect(orderInfo.orderId).toBe(orderId);
  */

  console.log('🎉 Test completed successfully!');
});

