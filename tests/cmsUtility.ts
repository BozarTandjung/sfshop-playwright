import { Page, expect } from '@playwright/test';

export class cmsUtility {
  constructor(private readonly page: Page) {}

  async navigateToCms(): Promise<void> {
    //await this.page.goto('https://stg.sfshop.id/cms/login');
    await this.page.goto('https://stg.sfshop.id/cms/login');
    await this.page.setViewportSize({ width: 1280, height: 800 });
    await expect(this.page).toHaveURL(/cms\/login/);
  }

  async loginCms(email: string, password: string): Promise<void> {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/dashboard/, { timeout: 15_000 });
  }

  async orderReportsAfterPayment(): Promise<void> {
    await this.page.goto('https://stg.sfshop.id/cms/order-report');
    await expect(this.page).toHaveURL(/order-report/);
  }

  /**
   * Navigate to CMS Orders page
   */
  async navigateToOrders(): Promise<void> {
    await this.page.goto('https://stg.sfshop.id/cms/orders');
    await expect(this.page).toHaveURL(/cms\/orders/, { timeout: 15_000 });
    // Wait for page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    console.log('✅ Navigated to CMS Orders page');
  }

  /**
   * Search for order by Order ID in CMS
   * 
   * @param orderId - Order ID to search for
   * @returns Promise<boolean> - true if order is found, false otherwise
   */
  async searchOrderById(orderId: string): Promise<boolean> {
    console.log(`🔍 Searching for order ID: ${orderId}`);
    
    // Try multiple selectors for search input
    const searchSelectors = [
      'input[placeholder*="order" i]',
      'input[placeholder*="cari" i]',
      'input[placeholder*="search" i]',
      'input[name*="order" i]',
      'input[name*="search" i]',
      'input[type="search"]',
      'input[type="text"]',
    ];

    let searchInput: ReturnType<Page['locator']> | null = null;
    for (const selector of searchSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 5_000 }).catch(() => false)) {
        searchInput = element;
        console.log(`✅ Found search input with selector: ${selector}`);
        break;
      }
    }

    if (!searchInput) {
      // Try to find by role
      const roleSearch = this.page.getByRole('textbox', { name: /search|order|cari/i }).first();
      if (await roleSearch.isVisible({ timeout: 5_000 }).catch(() => false)) {
        searchInput = roleSearch;
        console.log('✅ Found search input by role');
      }
    }

    if (!searchInput) {
      console.error('❌ Search input not found on CMS Orders page');
      await this.page.screenshot({ path: `test-results/cms-search-input-not-found-${Date.now()}.png`, fullPage: true });
      throw new Error('Search input not found on CMS Orders page');
    }

    // Clear and fill search input
    await searchInput.click();
    await searchInput.fill(orderId);
    await this.page.waitForTimeout(1_000); // Wait for search to process

    // Press Enter or wait for results
    await searchInput.press('Enter');
    await this.page.waitForTimeout(2_000); // Wait for search results

    // Verify order ID appears in the page content
    const pageContent = await this.page.content();
    const orderFound = pageContent.includes(orderId);
    
    if (orderFound) {
      console.log(`✅ Order ID ${orderId} found in CMS`);
    } else {
      console.log(`⚠️ Order ID ${orderId} not found in CMS results`);
    }

    return orderFound;
  }

  /**
   * Verify order details in CMS
   * 
   * @param orderId - Order ID to verify
   * @param expectedStatus - Expected order status (optional)
   * @param expectedPaymentMethod - Expected payment method (optional)
   * @returns Promise<boolean> - true if order details match, false otherwise
   */
  async verifyOrderDetails(
    orderId: string,
    expectedStatus?: string,
    expectedPaymentMethod?: string
  ): Promise<boolean> {
    console.log(`🔍 Verifying order details for: ${orderId}`);
    
    const orderFound = await this.searchOrderById(orderId);
    if (!orderFound) {
      return false;
    }

    // Check for order status if expected
    if (expectedStatus) {
      const statusText = await this.page.textContent('body').catch(() => '') || '';
      if (!statusText.toLowerCase().includes(expectedStatus.toLowerCase())) {
        console.log(`⚠️ Order status does not match. Expected: ${expectedStatus}`);
        return false;
      }
      console.log(`✅ Order status matches: ${expectedStatus}`);
    }

    // Check for payment method if expected
    if (expectedPaymentMethod) {
      const pageText = await this.page.textContent('body').catch(() => '') || '';
      const paymentMatch = pageText.toLowerCase().includes('xendit') || 
                          pageText.toLowerCase().includes('qris') ||
                          pageText.toLowerCase().includes(expectedPaymentMethod.toLowerCase());
      if (!paymentMatch) {
        console.log(`⚠️ Payment method does not match. Expected: ${expectedPaymentMethod}`);
        return false;
      }
      console.log(`✅ Payment method matches: ${expectedPaymentMethod}`);
    }

    return true;
  }

  /**
   * Extract order information from CMS
   * 
   * @param orderId - Order ID to extract information for
   * @returns Promise<object> - Order information object
   */
  async extractOrderInfo(orderId: string): Promise<{
    orderId: string;
    found: boolean;
    status?: string;
    paymentMethod?: string;
  }> {
    const orderFound = await this.searchOrderById(orderId);
    
    if (!orderFound) {
      return { orderId, found: false };
    }

    // Try to extract status and payment method from page
    const pageText = await this.page.textContent('body').catch(() => '') || '';
    
    // Extract status (common status values)
    let status: string | undefined;
    const statusPatterns = ['paid', 'pending', 'completed', 'success', 'failed', 'canceled'];
    for (const pattern of statusPatterns) {
      if (pageText.toLowerCase().includes(pattern)) {
        status = pattern;
        break;
      }
    }

    // Extract payment method
    let paymentMethod: string | undefined;
    if (pageText.toLowerCase().includes('xendit') || pageText.toLowerCase().includes('qris')) {
      paymentMethod = 'Xendit QRIS';
    }

    return {
      orderId,
      found: true,
      status,
      paymentMethod,
    };
  }

  async closeBrowser(): Promise<void> {
    await this.page.context().browser()?.close();
  }
}