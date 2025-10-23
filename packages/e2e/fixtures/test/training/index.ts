import { test as base, expect } from '@playwright/test';

export interface TrainingFixtures {
  /**
   * Resets the user's training progress
   */
  resetTrainingProgress: () => Promise<void>;

  /**
   * Set the given training to 'complete' on the server for the currently logged in user
   *
   * @param trainingId ID of the training to complete
   */
  completeTraining: (trainingId: string) => Promise<void>;
}

export const test = base.extend<TrainingFixtures>({
  async resetTrainingProgress({ request }, use) {
    await use(async () => {
      const response = await request.delete('/api/trainings/completed');
      expect(response.status()).toBe(204);
    });
  },

  async completeTraining({ request }, use) {
    await use(async (trainingId) => {
      const response = await request.post(`/api/trainings/completed/${trainingId}`);
      expect(response.status()).toBe(201);
    });
  },
});
