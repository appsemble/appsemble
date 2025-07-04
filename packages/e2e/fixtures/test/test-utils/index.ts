import { test as base } from '@playwright/test';

export interface TestUtilsFixtures {
  /**
   * Generates a random test ID based on details of the current test
   *
   * @returns Randomized test ID
   * @example '[chrome][index=1][retry=3]-123456'
   */
  randomTestId: () => string;
}

export const test = base.extend<TestUtilsFixtures>({
  randomTestId({ browserName }, use, testInfo) {
    use(
      () =>
        `[${browserName}][index=${testInfo.workerIndex}][retry=${testInfo.retry}]-${Math.floor(100_000 + Math.random() * 900_000)}`,
    );
  },
});
