import { type Training, type TrainingStatus } from '@appsemble/types';

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
