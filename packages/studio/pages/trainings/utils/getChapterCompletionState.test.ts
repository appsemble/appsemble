import { type Training } from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import { getChapterCompletionState } from './getChapterCompletionState.js';

describe('getChapterCompletionState', () => {
  it('should return "completed" if all trainings are completed', () => {
    const trainings: Training[] = [
      {
        id: '1',
        title: '1',
        path: '1',
        status: 'completed',
      },
    ];

    const status = getChapterCompletionState(trainings);

    expect(status).toBe('completed');
  });

  it('should return "in progress" if some trainings are completed', () => {
    const trainings: Training[] = [
      {
        id: '1',
        title: '1',
        path: '1',
        status: 'completed',
      },
      {
        id: '2',
        title: '2',
        path: '2',
        status: 'available',
      },
    ];

    const status = getChapterCompletionState(trainings);

    expect(status).toBe('in progress');
  });

  it('should return "available" if no trainings are completed', () => {
    const trainings: Training[] = [
      {
        id: '1',
        title: '1',
        path: '1',
        status: 'available',
      },
    ];

    const status = getChapterCompletionState(trainings);

    expect(status).toBe('available');
  });
});
