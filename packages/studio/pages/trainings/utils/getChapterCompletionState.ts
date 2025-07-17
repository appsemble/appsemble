import { type Training, type TrainingStatus } from '@appsemble/types';

/**
 * Calculates what the chapter's completion state is.
 *
 * Completion state does not include whether it's blocked or not.
 *
 * @param trainings The chapter's training modules
 * @returns Status of the chapter
 */
export function getChapterCompletionState(trainings: Training[]): TrainingStatus {
  const completedCount = trainings.filter(({ status }) => status === 'completed').length;
  if (completedCount === trainings.length) {
    return 'completed';
  }

  if (completedCount === 0) {
    return 'available';
  }

  return 'in progress';
}
