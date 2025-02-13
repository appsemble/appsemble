import { mkdir, rm, writeFile } from 'node:fs/promises';

import { logger } from '@appsemble/node-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { syncTrainings } from './syncTrainings.js';
import { Training } from '../models/Training.js';

const basePath = 'training-test';
const chapterPath = `${basePath}/test-chapter`;

beforeEach(async () => {
  vi.spyOn(logger, 'error').mockImplementation(null);

  await mkdir(basePath);
  await mkdir(chapterPath);
});

afterEach(async () => {
  await rm(basePath, { force: true, recursive: true });
});

describe('syncTrainings', () => {
  it('should create a new database entry based on a new training document', async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
      trainingOrder: ['training-1'],
    });
    await writeFile(`${chapterPath}/properties.json`, properties);
    await mkdir(`${chapterPath}/training-1`);
    await writeFile(`${chapterPath}/training-1/index.md`, '');

    await syncTrainings(basePath);

    const training = await Training.findByPk('training-1');
    expect(training).not.toBeNull();
  });

  it('should delete database entry if the related training document no longer exists', async () => {
    await Training.create({ id: 'old-training' });
    await syncTrainings(basePath);

    const training = await Training.findByPk('old-training');

    expect(training).toBeNull();
  });
});
