import { test as base, expect } from '@playwright/test';

export interface TrainingFixtures {
  /**
   * Resets the user's training progress
   */
  resetTrainingProgress: () => Promise<void>;
}

export const test = base.extend<TrainingFixtures>({
  async resetTrainingProgress({ baseURL, context }, use) {
    await use(async () => {
      const accessToken = (await context.storageState()).origins[0].localStorage[0].value;
      expect(accessToken).not.toBeNull();

      const { status } = await fetch(`${baseURL}/api/trainings/completed`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      expect(status).toBe(204);
    });
  },
});
