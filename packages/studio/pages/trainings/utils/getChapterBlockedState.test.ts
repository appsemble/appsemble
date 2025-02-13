import { type TrainingChapter } from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import { getChapterBlockedState } from './getChapterBlockedState.js';

describe('getChapterBlockedState', () => {
  it('should return blocked if blocking chapter is not completed', () => {
    const blockedChapter: TrainingChapter = {
      blockedBy: 'blocking-chapter',
      id: 'blocked-chapter',
      title: 'blocked-chapter',
      status: 'available',
      trainings: [],
    };
    const chapters: TrainingChapter[] = [
      {
        blockedBy: null,
        id: 'blocking-chapter',
        title: 'blocking-chapter',
        status: 'blocked',
        trainings: [],
      },
      blockedChapter,
    ];

    const status = getChapterBlockedState(blockedChapter, chapters);

    expect(status).toBe('blocked');
  });

  it('should return status if blocking chapter is completed', () => {
    const blockedChapter: TrainingChapter = {
      blockedBy: 'blocking-chapter',
      id: 'blocked-chapter',
      title: 'blocked-chapter',
      status: 'in progress',
      trainings: [],
    };
    const chapters: TrainingChapter[] = [
      {
        blockedBy: null,
        id: 'blocking-chapter',
        title: 'blocking-chapter',
        status: 'completed',
        trainings: [],
      },
      blockedChapter,
    ];

    const status = getChapterBlockedState(blockedChapter, chapters);

    expect(status).toBe('in progress');
  });
});
