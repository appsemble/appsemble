import { test as base } from '@playwright/test';

export interface TestUtilsFixtures {
  /**
   * Generates a random test ID based on details of the current test
   *
   * @param level The level of detail to add. Each level adds more detail\
   *   1 = Browser name\
   *   2 = Worker index\
   *   3 = Retry count
   * @returns Randomized test ID
   * @example '[chrome][index=1][retry=3]-123456'
   */
  randomTestId: (level?: 1 | 2 | 3) => string;
}

export const test = base.extend<TestUtilsFixtures>({
  randomTestId({ browserName }, use, testInfo) {
    use((level) => {
      let prefix = '';
      if (level) {
        if (level >= 1) {
          prefix = prefix.concat(`[${browserName}]`);
        }
        if (level >= 2) {
          prefix = prefix.concat(`[index=${testInfo.workerIndex}]`);
        }
        if (level >= 3) {
          prefix = prefix.concat(`[retry=${testInfo.retry}]`);
        }
      }

      return `${prefix}${prefix === '' ? '' : '-'}${Math.floor(100_000 + Math.random() * 900_000)}`;
    });
  },
});
