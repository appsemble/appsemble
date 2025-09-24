import { mkdir, rm, writeFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { syncTrainings } from './syncTrainings.js';
import { Training } from '../models/main/Training.js';

const basePath = 'training-test';
const chapterPath = `${basePath}/test-chapter`;

beforeEach(async () => {
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

  it('should do nothing if training is already in database', async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
      trainingOrder: ['existing-training'],
    });
    await Training.create({ id: 'existing-training' });
    await writeFile(`${chapterPath}/properties.json`, properties);
    await mkdir(`${chapterPath}/existing-training`);
    await writeFile(`${chapterPath}/existing-training/index.md`, '');

    await syncTrainings(basePath);

    const training = await Training.findByPk('existing-training');
    expect(training).not.toBeNull();
  });
});
