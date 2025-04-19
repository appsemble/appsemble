import {
  expect as base,
  type ExpectMatcherState,
  type Locator,
  type MatcherReturnType,
} from '@playwright/test';

import {
  availableColor,
  blockedColor,
  completedColor,
  inProgressColor,
  type TrainingStatus,
} from '../../studio/trainings/constants.js';

export interface Matchers<R> {
  [key: string]: (this: ExpectMatcherState, ...args: any[]) => Promise<R> | R;

  /**
   * Asserts whether all child elements of this training node are correct for the given state
   *
   * @param trainingNode Training node in the tree to assert
   * @param status Status of the training
   */
  toHaveChapterStatus: (trainingNode: Locator, status: TrainingStatus) => Promise<R>;
}

export const expect = base.extend<Matchers<MatcherReturnType>>({
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
