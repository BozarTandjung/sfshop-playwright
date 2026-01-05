/**
 * STEP 1: Test Data Management
 * 
 * Centralized storage untuk semua test data.
 * Benefits:
 * - Single source of truth
 * - Easy to update
 * - Type-safe dengan TypeScript
 * - Reusable across tests
 * 
 * Cara pakai:
 * import { getCustomerData, getPaymentMethod } from '../helpers/test-data';
 * const customer = getCustomerData('default');
 */

// =========================
// TypeScript Interfaces
// =========================

export interface CustomerData {
  playerId: string;
  zoneId: string;
  email: string;
  phone: string;
}

export interface PaymentMethod {
  name: string;
  type: 'virtual_account' | 'qris' | 'ewallet';
  selector: string;
  requiresOTP: boolean;
  requiresSimulation: boolean;
}

export interface ProductData {
  name: string;
  imageAlt: string;
  category: string;
}

// =========================
// Customer Test Data
// =========================

/**
 * Customer data untuk testing
 * Bisa tambah customer lain sesuai kebutuhan
 */
export const testCustomers = {
  // Default customer untuk happy path
  default: {
    playerId: '115383687',
    zoneId: '2584',
    email: 'bozartandjung@gmail.com',
    phone: '088110001000',
  } as CustomerData,
  
  // Alternative customer untuk testing data variation
  alternative: {
    playerId: '987654321',
    zoneId: '1234',
    email: 'test.user@sfshop.id',
    phone: '081234567890',
  } as CustomerData,
  
  // Invalid data untuk negative testing
  invalid: {
    playerId: '123',
    zoneId: '45',
    email: 'invalid-email',
    phone: '123',
  } as CustomerData,
};

// =========================
// Payment Method Data
// =========================

/**
 * Payment method configurations
 * Tambahkan payment method baru di sini
 */
export const paymentMethods = {
  ximpaysf: {
    name: 'XimpaySF Virtual Account',
    type: 'virtual_account',
    selector: 'img[alt*="ximpaysf"]',
    requiresOTP: true,
    requiresSimulation: false,
  } as PaymentMethod,
  
  xenditQris: {
    name: 'Xendit QRIS',
    type: 'qris',
    selector: 'img[alt*="xenditqris"]',
    requiresOTP: false,
    requiresSimulation: true,
  } as PaymentMethod,
  
  // Template untuk payment method baru:
  // gopay: {
  //   name: 'GoPay',
  //   type: 'ewallet',
  //   selector: 'img[alt*="gopay"]',
  //   requiresOTP: true,
  //   requiresSimulation: false,
  // } as PaymentMethod,
};

// =========================
// Product Data
// =========================

/**
 * Product information
 */
export const testProducts = {
  mobileLegends: {
    name: 'Mobile Legends',
    imageAlt: '25+3 Diamonds product selected',
    category: 'games',
  } as ProductData,
  
  // Template untuk product baru:
  // freeFire: {
  //   name: 'Free Fire',
  //   imageAlt: 'free fire',
  //   category: 'games',
  // } as ProductData,
};

// =========================
// OTP Test Data
// =========================

/**
 * OTP values untuk testing
 */
export const testOTP = {
  valid: ['1', '2', '3', '4'],
  invalid: ['0', '0', '0', '0'],
};

// =========================
// Timeout Configurations
// =========================

/**
 * Centralized timeout values
 * Lebih mudah untuk adjust semuanya dari sini
 */
export const timeouts = {
  short: 5_000,       // 5 seconds - untuk element yang cepat muncul
  medium: 15_000,     // 15 seconds - untuk interactions
  long: 60_000,       // 1 minute - untuk page loads
  veryLong: 120_000,  // 2 minutes - untuk payment processing
};

// =========================
// Helper Functions
// =========================

/**
 * Get customer data by type
 * 
 * @param type - 'default', 'alternative', atau 'invalid'
 * @returns CustomerData object
 * 
 * Example:
 * const customer = getCustomerData('default');
 * await page.fill('#email', customer.email);
 */
export function getCustomerData(type: keyof typeof testCustomers = 'default'): CustomerData {
  return testCustomers[type];
}

/**
 * Get payment method configuration
 * 
 * @param type - 'ximpaysf' atau 'xenditQris'
 * @returns PaymentMethod object
 * 
 * Example:
 * const payment = getPaymentMethod('ximpaysf');
 * await page.locator(payment.selector).click();
 */
export function getPaymentMethod(type: keyof typeof paymentMethods): PaymentMethod {
  return paymentMethods[type];
}

/**
 * Get product data
 * 
 * @param type - 'mobileLegends', etc
 * @returns ProductData object
 * 
 * Example:
 * const product = getProduct('mobileLegends');
 * await page.getByRole('link', { name: product.name }).click();
 */
export function getProduct(type: keyof typeof testProducts): ProductData {
  return testProducts[type];
}

/**
 * Get base URL based on environment
 * 
 * @returns Base URL string
 */
export function getBaseURL(): string {
  return process.env.BASE_URL || 'https://stg.sfshop.id';
}