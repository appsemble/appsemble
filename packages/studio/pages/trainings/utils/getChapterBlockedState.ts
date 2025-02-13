import { type TrainingChapter, type TrainingStatus } from '@appsemble/types';

export function getChapterBlockedState(
  chapter: TrainingChapter,
  chapters: TrainingChapter[],
): TrainingStatus {
  const { blockedBy, status } = chapter;
  if (!blockedBy) {
    return status;
  }
  const blockedByChapter = chapters.find(({ id }) => id === blockedBy);
  if (blockedByChapter.status !== 'completed') {
    return 'blocked';
  }

  return status;
}
