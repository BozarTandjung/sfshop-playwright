import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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

const testData = readCSV('mobile-legends-test.csv');

/* =====================
   STEP 3: GENERATE TEST
   ===================== */
for (const data of testData) {

  test(`[${data.type.toUpperCase()}] ${data.testName}`, async ({ page }) => {

    /* =====================
       STEP 4: TEST FLOW
       ===================== */
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('#playerID input').fill(data.playerID);
    await page.locator('#zoneID input').fill(data.zoneID);
    await page.locator('#email input').fill(data.email);
    await page.locator('#phone input').fill(data.phone);

    const lanjutBtn = page.getByRole('button', { name: /lanjutkan/i });

    if (data.type === 'negative') {
      await lanjutBtn.click();

      /* =====================
         STEP 5: NEGATIVE ASSERT
         ===================== */
      const errorLocator = page.locator(
        `text=/${data.expectedError}|wajib|invalid|salah/i`
      );

      await expect(errorLocator.first()).toBeVisible();
      return;
    }

    await lanjutBtn.click();

    /* =====================
       STEP 5: POSITIVE ASSERT
       ===================== */
    await expect
      .poll(() => page.url(), { timeout: 120_000 })
      .toMatch(/order\/[a-zA-Z0-9]+/);

  });
}
