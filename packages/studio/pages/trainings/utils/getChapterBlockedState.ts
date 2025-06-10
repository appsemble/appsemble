import { type TrainingChapter, type TrainingStatus } from '@appsemble/types';

/**
 * Calculates whether the chapter should be blocked. It does this by checking whether the blocking
 * chapters are all completed. If any of them aren't, it returns `blocked`. Otherwise it returns
 * the status of the chapter.
 *
 * @param chapter Chapter to check the blocked state of
 * @param chapters All training chapters
 * @returns Returns `blocked` if any of the blocking chapters aren't completed yet. Otherwise,
 *   returns the chapter's status.
 */
export function getChapterBlockedState(
  chapter: TrainingChapter,
  chapters: TrainingChapter[],
): TrainingStatus {
  const { blockedBy, status } = chapter;
  if (!blockedBy) {
    return status;
  }

  const blockerIds = typeof blockedBy === 'string' ? [blockedBy] : blockedBy;
  if (blockerIds.length === 0) {
    return status;
  }

  const blockingChapters = chapters.filter(({ id }) => blockerIds.includes(id));
  const areAllChaptersCompleted = blockingChapters.every(
    ({ status: blockedChapterStatus }) => blockedChapterStatus === 'completed',
  );

  if (!areAllChaptersCompleted) {
    return 'blocked';
  }

  return status;
}
