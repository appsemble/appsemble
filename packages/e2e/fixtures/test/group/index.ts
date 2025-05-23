import { test as base } from '@playwright/test';

export interface GroupFixtures {
  /**
   * Set the role of the member in a group.
   *
   * @param appId The app to set the role for.
   * @param group The group to set the role for.
   * @param role The role to set.
   */
  changeGroupRole: (appId: number, group: string, role: string) => Promise<void>;
}

export const test = base.extend<GroupFixtures>({
  async changeGroupRole({ browser }, use) {
    await use(async (appId, group, role) => {
      const page = await browser.newPage();

      await page.goto(`/en/apps/${appId}/-/groups`);
      await page.click(`text=${group}`);
      await page.getByRole('row', { name: 'Bot' }).locator('#role').selectOption(role);

      await page.close();
    });
  },
});
