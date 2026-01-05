/**
 * Global Teardown Script
 * 
 * Sends email report after all tests complete.
 * 
 * Environment Variables:
 * - SEND_EMAIL_REPORT: true/false (default: false - DISABLED FOR NOW)
 * - EMAIL_ON_FAILURES_ONLY: true/false (default: false)
 * 
 * NOTE: Email reporting is currently disabled by default.
 * To enable: Set SEND_EMAIL_REPORT=true or change default below to true
 */

import { sendTestReport } from './helpers/email-reporter';

async function globalTeardown() {
  // Email reporting disabled for now - change to !== 'false' to enable
  const sendEmail = process.env.SEND_EMAIL_REPORT === 'true';
  
  if (sendEmail) {
    console.log('📧 Sending test report via email...');
    try {
      await sendTestReport();
    } catch (error) {
      // Don't fail the test run if email fails
      console.error('⚠️ Failed to send email report:', error);
    }
  } else {
    console.log('📧 Email reporting is currently disabled (set SEND_EMAIL_REPORT=true to enable)');
  }
}

export default globalTeardown;

