import { type TrainingStatus } from '@appsemble/types';
import { expect as base, type Locator } from '@playwright/test';

import {
  availableColor,
  blockedColor,
  completedColor,
  inProgressColor,
} from '../../../tests/studio/trainings/constants.js';

export interface TrainingMatchers {
  /**
   * Asserts whether all child elements of this training node are correct for the given state
   *
   * @param status Status of the training
   */
  toHaveChapterStatus: (trainingNode: Locator, status: TrainingStatus) => Promise<void>;
}

export const expect = base.extend({
  async toHaveChapterStatus(trainingNode: Locator, status: TrainingStatus) {
    let backgroundColor = availableColor;
    let title = 'node-title-available';
    switch (status) {
      case 'blocked':
        backgroundColor = blockedColor;
        title = 'node-title-blocked';
        break;
      case 'completed':
        backgroundColor = completedColor;
        break;
      case 'in progress':
        backgroundColor = inProgressColor;
        break;
      default:
        backgroundColor = availableColor;
    }

    await expect(trainingNode.getByTestId('status-circle')).toHaveCSS(
      'background-color',
      backgroundColor,
    );
    await expect(trainingNode.getByTestId(title)).toBeVisible();

    return {
      message: () => 'All elements are valid',
      pass: true,
      name: 'toHaveChapterStatus',
    };
  },
});
