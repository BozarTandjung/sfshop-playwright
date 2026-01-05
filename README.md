# SFShop Playwright Test Automation

Automated testing framework for SFShop using Playwright with support for payment flows, CMS verification, and email reporting.

## Features

- ✅ End-to-end payment testing (Xendit QRIS, XimpaySF)
- ✅ Data-driven testing (DDT) with CSV support
- ✅ CMS order verification
- ✅ Email reporting via Gmail SMTP
- ✅ Multi-device support (Mobile & Desktop)
- ✅ Robust error handling and retry mechanisms

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gmail account with App Password (for email reporting, optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BozarTandjung/sfshop-playwright.git
cd sfshop-playwright
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

## Configuration

### Base Configuration

The test suite uses `https://stg.sfshop.id` as the default base URL. You can override this using environment variables:

```bash
# Windows PowerShell
$env:BASE_URL="https://stg.sfshop.id"
npm test

# Linux/Mac
BASE_URL=https://stg.sfshop.id npm test
```

### Email Reporting (Optional)

Email reporting is **disabled by default**. To enable:

1. Copy the example configuration file:
```bash
cp email-config.example.json email-config.json
```

2. Edit `email-config.json` and fill in your Gmail credentials:
```json
{
  "gmail": {
    "user": "your-email@gmail.com",
    "appPassword": "your-app-password-here"
  },
  "recipients": [
    "recipient@example.com"
  ],
  "sendAlways": true,
  "sendOnFailuresOnly": false
}
```

3. Get Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Sign in to your Google account
   - Select 'Mail' and 'Other (Custom name)'
   - Enter 'Playwright Tests' as the name
   - Click 'Generate' and copy the 16-character password

4. Enable email reporting:
```bash
# Enable via environment variable
$env:SEND_EMAIL_REPORT="true"
npm test
```

Alternatively, you can use environment variables instead of config file:
```bash
$env:GMAIL_USER="your-email@gmail.com"
$env:GMAIL_APP_PASSWORD="your-app-password"
$env:EMAIL_RECIPIENTS="recipient1@example.com,recipient2@example.com"
$env:SEND_EMAIL_REPORT="true"
npm test
```

### CMS Verification (Optional)

CMS verification is **currently disabled** in the test. To enable:

1. Edit `tests/xendit-qris-cms-verification.spec.ts`
2. Uncomment the CMS verification section (Step 7)
3. Ensure CMS credentials are correct in `tests/testData.json`:
```json
[
  {
    "testStep": "Login_Cms",
    "testStepDesc": "Login with valid credentials",
    "param1": "your-email@smartfren.com",
    "param2": "YourPassword"
  }
]
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx playwright test tests/xendit-qris-ddt.spec.ts
```

### Run Specific Project (Mobile or Desktop)
```bash
# Desktop only
npx playwright test --project=desktop-chromium

# Mobile only
npx playwright test --project=mobile-chromium
```

### Run Tests with Filter
```bash
# Run only positive test cases
npx playwright test --grep "POSITIVE"

# Run only negative test cases
npx playwright test --grep "NEGATIVE"
```

### Run Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

## Test Structure

### Test Files

- `tests/mobile-legends-xendit-qris.spec.ts` - Basic Xendit QRIS payment test
- `tests/xendit-qris-cms-verification.spec.ts` - Xendit QRIS with CMS verification (CMS disabled by default)
- `tests/xendit-qris-ddt.spec.ts` - Data-driven test for Xendit QRIS (positive & negative cases)
- `tests/purchase-mobile-legends.spec.ts` - XimpaySF payment test
- `tests/mobile-legends-ddt.spec.ts` - Data-driven test for basic flow

### Test Data

Test data is stored in CSV files under `tests/data/`:

- `tests/data/xendit-qris-test.csv` - Test cases for Xendit QRIS DDT
- `tests/data/mobile-legends-test.csv` - Test cases for basic flow DDT

CSV Format:
```csv
testName,type,playerID,zoneID,email,phone,expectedError
Valid Purchase,positive,115383687,2584,test@mail.com,088110001000,
Invalid Player ID,negative,abc123,2584,test@mail.com,088110001000,Player ID tidak valid
```

### Helper Functions

Helper functions are located in `helpers/`:

- `helpers/page-actions.ts` - Reusable page actions (navigation, form filling, payment, etc.)
- `helpers/test-data.ts` - Test data management and configuration
- `helpers/email-reporter.ts` - Email reporting utility

### CMS Utility

CMS utility is in `tests/cmsUtility.ts`:
- Navigate to CMS
- Login to CMS
- Search orders by ID
- Verify order details
- Extract order information

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Base URL for tests | `https://stg.sfshop.id` |
| `SEND_EMAIL_REPORT` | Enable email reporting | `false` |
| `EMAIL_ON_FAILURES_ONLY` | Send email only on failures | `false` |
| `GMAIL_USER` | Gmail address for sending reports | - |
| `GMAIL_APP_PASSWORD` | Gmail app password | - |
| `EMAIL_RECIPIENTS` | Comma-separated recipient emails | - |
| `WORKERS` | Number of test workers | `1` |
| `CI` | CI/CD environment flag | `false` |

## Reports

### HTML Report
After running tests, view the HTML report:
```bash
npm run report
```

Or:
```bash
npx playwright show-report
```

### JSON Report
JSON report is generated at `playwright-report/report.json` and can be used for programmatic processing or email reporting.

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check network connectivity
- Verify the staging environment is accessible

### Email Reporting Not Working
- Verify `email-config.json` exists and has correct credentials
- Check Gmail App Password is valid
- Ensure `SEND_EMAIL_REPORT=true` is set
- Check console logs for error messages

### CMS Verification Fails
- Verify CMS credentials in `tests/testData.json`
- Check CMS URL is accessible
- Ensure order has sufficient time to appear in CMS (may take a few seconds)

### Payment Simulation Not Working
- Verify you're testing on staging environment (simulate button only exists in staging)
- Check Xendit checkout page loads correctly
- Verify network connectivity

## Project Structure

```
.
├── helpers/
│   ├── page-actions.ts      # Reusable page actions
│   ├── test-data.ts         # Test data management
│   └── email-reporter.ts    # Email reporting utility
├── tests/
│   ├── data/                # CSV test data files
│   ├── helpers/             # Test-specific helpers
│   ├── *.spec.ts           # Test files
│   ├── cmsUtility.ts       # CMS utility functions
│   └── testData.json       # CMS credentials
├── playwright.config.ts     # Playwright configuration
├── global-teardown.ts       # Global teardown (email reporting)
├── email-config.example.json # Email config template
└── README.md               # This file
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests to ensure everything passes
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## License

ISC

## Support

For issues and questions, please create an issue in the GitHub repository.

