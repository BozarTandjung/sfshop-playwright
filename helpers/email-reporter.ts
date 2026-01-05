/**
 * Email Reporter Utility
 * 
 * Sends test reports via Gmail SMTP using nodemailer.
 * Supports configurable triggers (always, failures only).
 * 
 * Usage:
 * import { sendTestReport } from '../helpers/email-reporter';
 * await sendTestReport();
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailConfig {
  gmail: {
    user: string;
    appPassword: string;
  };
  recipients: string[];
  sendAlways: boolean;
  sendOnFailuresOnly: boolean;
}

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  project?: string;
}

/**
 * Load email configuration from file or environment variables
 */
function loadEmailConfig(): EmailConfig | null {
  // Try to load from email-config.json
  const configPath = path.resolve(process.cwd(), 'email-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent) as EmailConfig;
    } catch (error) {
      console.error('❌ Error reading email-config.json:', error);
      return null;
    }
  }

  // Try environment variables
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const recipients = process.env.EMAIL_RECIPIENTS?.split(',').map(r => r.trim()) || [];
  const sendAlways = process.env.SEND_EMAIL_REPORT !== 'false';
  const sendOnFailuresOnly = process.env.EMAIL_ON_FAILURES_ONLY === 'true';

  if (gmailUser && gmailPassword && recipients.length > 0) {
    return {
      gmail: {
        user: gmailUser,
        appPassword: gmailPassword,
      },
      recipients,
      sendAlways,
      sendOnFailuresOnly,
    };
  }

  return null;
}

/**
 * Read and parse Playwright JSON report
 */
function readTestReport(): any {
  const reportPath = path.resolve(process.cwd(), 'playwright-report', 'report.json');
  
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Test report not found:', reportPath);
    return null;
  }

  try {
    const reportContent = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(reportContent);
  } catch (error) {
    console.error('❌ Error reading test report:', error);
    return null;
  }
}

/**
 * Extract test results from Playwright report
 */
function extractTestResults(report: any): TestResult[] {
  const results: TestResult[] = [];

  if (!report.suites) {
    return results;
  }

  function extractFromSpec(spec: any, projectName?: string) {
    if (spec.specs) {
      for (const testSpec of spec.specs) {
        if (testSpec.tests) {
          for (const test of testSpec.tests) {
            for (const result of test.results || []) {
              results.push({
                title: test.title || testSpec.title || 'Unknown Test',
                status: result.status === 'passed' ? 'passed' : result.status === 'failed' ? 'failed' : 'skipped',
                duration: result.duration,
                error: result.error?.message || result.error?.stack,
                project: projectName || spec.title,
              });
            }
          }
        }
      }
    }

    if (spec.suites) {
      for (const subSuite of spec.suites) {
        extractFromSpec(subSuite, projectName || spec.title);
      }
    }
  }

  for (const suite of report.suites) {
    extractFromSpec(suite);
  }

  return results;
}

/**
 * Generate HTML email body from test results
 */
function generateEmailHTML(testResults: TestResult[], summary: {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}): string {
  const statusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#10b981'; // green
      case 'failed': return '#ef4444'; // red
      case 'skipped': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  const failedTests = testResults.filter(t => t.status === 'failed');
  const passedTests = testResults.filter(t => t.status === 'passed');
  const skippedTests = testResults.filter(t => t.status === 'skipped');

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatError = (error?: string) => {
    if (!error) return '';
    const maxLength = 500;
    if (error.length > maxLength) {
      return error.substring(0, maxLength) + '...';
    }
    return error;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .summary { background: #f3f4f6; padding: 20px; border: 1px solid #e5e7eb; }
    .summary-item { display: inline-block; margin: 10px 20px 10px 0; }
    .summary-label { font-weight: bold; color: #6b7280; }
    .summary-value { font-size: 24px; font-weight: bold; }
    .test-list { margin-top: 20px; }
    .test-item { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 4px; background: #f9fafb; }
    .test-title { font-weight: bold; margin-bottom: 5px; }
    .test-details { font-size: 14px; color: #6b7280; }
    .test-error { background: #fef2f2; padding: 10px; margin-top: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #991b1b; }
    .footer { margin-top: 30px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Playwright Test Report</h1>
      <p>Test execution completed on ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Total Tests</div>
        <div class="summary-value" style="color: #2563eb;">${summary.total}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Passed</div>
        <div class="summary-value" style="color: #10b981;">${summary.passed}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Failed</div>
        <div class="summary-value" style="color: #ef4444;">${summary.failed}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Skipped</div>
        <div class="summary-value" style="color: #f59e0b;">${summary.skipped}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Duration</div>
        <div class="summary-value" style="color: #6b7280;">${formatDuration(summary.duration)}</div>
      </div>
    </div>

    ${failedTests.length > 0 ? `
    <div class="test-list">
      <h2 style="color: #ef4444;">❌ Failed Tests (${failedTests.length})</h2>
      ${failedTests.map(test => `
        <div class="test-item" style="border-left-color: ${statusColor(test.status)};">
          <div class="test-title">${test.title}</div>
          <div class="test-details">
            Project: ${test.project || 'N/A'} | Duration: ${formatDuration(test.duration)}
          </div>
          ${test.error ? `
            <div class="test-error">
              ${formatError(test.error).replace(/\n/g, '<br>')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${passedTests.length > 0 && failedTests.length === 0 ? `
    <div class="test-list">
      <h2 style="color: #10b981;">✅ All Tests Passed!</h2>
      ${passedTests.slice(0, 10).map(test => `
        <div class="test-item" style="border-left-color: ${statusColor(test.status)};">
          <div class="test-title">${test.title}</div>
          <div class="test-details">
            Project: ${test.project || 'N/A'} | Duration: ${formatDuration(test.duration)}
          </div>
        </div>
      `).join('')}
      ${passedTests.length > 10 ? `<p><em>... and ${passedTests.length - 10} more passed tests</em></p>` : ''}
    </div>
    ` : ''}

    ${skippedTests.length > 0 ? `
    <div class="test-list">
      <h2 style="color: #f59e0b;">⏭️ Skipped Tests (${skippedTests.length})</h2>
      ${skippedTests.map(test => `
        <div class="test-item" style="border-left-color: ${statusColor(test.status)};">
          <div class="test-title">${test.title}</div>
          <div class="test-details">Project: ${test.project || 'N/A'}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <p>Report generated by Playwright Test Runner</p>
      <p>Environment: ${process.env.BASE_URL || 'https://stg.sfshop.id'}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send test report via email
 * 
 * @param forceSend - Force send even if conditions are not met (default: false)
 * @returns Promise<boolean> - true if email was sent successfully, false otherwise
 */
export async function sendTestReport(forceSend: boolean = false): Promise<boolean> {
  const config = loadEmailConfig();
  
  if (!config) {
    console.log('⚠️ Email configuration not found. Skipping email report.');
    console.log('   Please create email-config.json or set environment variables:');
    console.log('   - GMAIL_USER');
    console.log('   - GMAIL_APP_PASSWORD');
    console.log('   - EMAIL_RECIPIENTS (comma-separated)');
    return false;
  }

  const report = readTestReport();
  if (!report) {
    console.error('❌ Cannot send email: Test report not found');
    return false;
  }

  const testResults = extractTestResults(report);
  
  // Calculate summary
  const summary = {
    total: testResults.length,
    passed: testResults.filter(t => t.status === 'passed').length,
    failed: testResults.filter(t => t.status === 'failed').length,
    skipped: testResults.filter(t => t.status === 'skipped').length,
    duration: testResults.reduce((sum, t) => sum + (t.duration || 0), 0),
  };

  // Check if we should send email
  if (!forceSend) {
    if (!config.sendAlways && summary.failed === 0) {
      console.log('✅ All tests passed and sendAlways is false. Skipping email.');
      return false;
    }
    
    if (config.sendOnFailuresOnly && summary.failed === 0) {
      console.log('✅ All tests passed and sendOnFailuresOnly is true. Skipping email.');
      return false;
    }
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmail.user,
      pass: config.gmail.appPassword,
    },
  });

  // Generate email content
  const htmlContent = generateEmailHTML(testResults, summary);
  const subject = summary.failed > 0 
    ? `❌ Test Report: ${summary.failed} Failed, ${summary.passed} Passed`
    : `✅ Test Report: All ${summary.passed} Tests Passed`;

  // Send email
  try {
    await transporter.sendMail({
      from: `Playwright Tests <${config.gmail.user}>`,
      to: config.recipients.join(', '),
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Test report emailed to: ${config.recipients.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

