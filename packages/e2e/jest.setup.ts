import { promises as fs, rmSync } from 'fs';
import { join } from 'path';

import { normalize } from '@appsemble/utils';

// The timeout on puppeteer tests is one minute seconds for each test / hook
jest.setTimeout(60_000);

const screenshotsDir = join(__dirname, '__screenshots__');
rmSync(screenshotsDir, { force: true, recursive: true });

/**
 * Save a screenshot after each test.
 */
afterEach(async () => {
  await fs.mkdir(screenshotsDir, { recursive: true });
  const { currentTestName } = expect.getState();
  const path = join(screenshotsDir, `${normalize(currentTestName)}.png`);
  await page.screenshot({ path });
});
