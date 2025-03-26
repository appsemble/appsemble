import { mkdir, rm, writeFile } from 'node:fs/promises';

import { logger } from '@appsemble/node-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getValidTrainings } from './getValidTrainings.js';

const basePath = 'training-test';
const chapterPath = `${basePath}/test-chapter`;

beforeEach(async () => {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  vi.spyOn(logger, 'error').mockImplementation(null);

  await mkdir(basePath);
  await mkdir(chapterPath);
});

afterEach(async () => {
  await rm(basePath, { force: true, recursive: true });
});

describe('getValidTrainings', () => {
  it('should throw an error if chapter does not have a properties.json', async () => {
    await getValidTrainings(basePath);

    expect(logger.error).toHaveBeenCalledWith(
      'Chapter directory "test-chapter" is missing a \'properties.json\' file',
    );
  });

  it('should throw an error if properties.json does not have the required properties', async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
    });
    await writeFile(`${chapterPath}/properties.json`, properties);

    await getValidTrainings(basePath);

    expect(logger.error).toHaveBeenCalledWith(
      'Missing properties [trainingOrder] in "properties.json"',
    );
  });

  it("should throw an error if the given training doesn't exist", async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
      trainingOrder: ['training-1'],
    });
    await writeFile(`${chapterPath}/properties.json`, properties);

    await getValidTrainings(basePath);

    expect(logger.error).toHaveBeenCalledWith('Could not find "training-1"');
  });

  it('should throw an error if chapter does not have any training content', async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
      trainingOrder: ['training-1'],
    });
    await writeFile(`${chapterPath}/properties.json`, properties);
    await mkdir(`${chapterPath}/training-1`);

    await getValidTrainings(basePath);

    expect(logger.error).toHaveBeenCalledWith('Training "training-1" is missing an index.md');
  });

  it('should return a list with all valid training ids', async () => {
    const properties = JSON.stringify({
      blockedBy: null,
      title: '',
      trainingOrder: ['training-1'],
    });
    await writeFile(`${chapterPath}/properties.json`, properties);
    await mkdir(`${chapterPath}/training-1`);
    await writeFile(`${chapterPath}/training-1/index.md`, '');

    const trainingIds = await getValidTrainings(basePath);

    expect(trainingIds).toStrictEqual(['training-1']);
  });
});
