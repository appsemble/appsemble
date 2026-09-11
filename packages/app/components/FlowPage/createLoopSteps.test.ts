import { type LoopPageDefinition } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { appendLoopResult, createLoopSteps, getLoopStepPrefix } from './createLoopSteps.js';

const foreach = {
  name: 'Question',
  blocks: [{ type: 'markdown', version: '1.0.0' }],
};

describe('createLoopSteps', () => {
  it('places start and end pages around the generated pages', () => {
    const start = { name: 'Introduction', blocks: [{ type: 'form', version: '1.0.0' }] };
    const end = { name: 'Complete', blocks: [{ type: 'markdown', version: '1.0.0' }] };
    const pageDefinition: LoopPageDefinition = {
      type: 'loop',
      name: 'Survey',
      actions: { onLoad: { type: 'noop' } },
      foreach,
      start,
      end,
    };
    const questions = [{ question: 'First?' }, { question: 'Second?' }];

    const result = createLoopSteps(pageDefinition, questions);

    expect(result.steps).toStrictEqual([
      start,
      { ...foreach, name: 'New loop page' },
      { ...foreach, name: 'New loop page' },
      end,
    ]);
    expect(result.loopData).toStrictEqual([undefined, ...questions, undefined]);
  });

  it('generates only loop pages when start and end are omitted', () => {
    const pageDefinition: LoopPageDefinition = {
      type: 'loop',
      name: 'Survey',
      actions: { onLoad: { type: 'noop' } },
      foreach,
    };
    const questions = [{ question: 'First?' }, { question: 'Second?' }];

    const result = createLoopSteps(pageDefinition, questions);

    expect(result.steps).toStrictEqual([
      { ...foreach, name: 'New loop page' },
      { ...foreach, name: 'New loop page' },
    ]);
    expect(result.loopData).toStrictEqual(questions);
  });
});

describe('appendLoopResult', () => {
  it('only includes results from generated loop pages', () => {
    const results = appendLoopResult([], undefined, { introduction: true });
    const withQuestion = appendLoopResult(results, { id: 1 }, { answer: 'Yes' });

    expect(appendLoopResult(withQuestion, undefined, { complete: true })).toStrictEqual([
      { id: 1, answer: 'Yes' },
    ]);
  });
});

describe('getLoopStepPrefix', () => {
  it('uses the last-step prefix for an end-only page without generated items', () => {
    const pageDefinition: LoopPageDefinition = {
      type: 'loop',
      name: 'Survey',
      actions: { onLoad: { type: 'noop' } },
      foreach,
      end: { name: 'Complete', blocks: [] },
    };

    expect(getLoopStepPrefix(pageDefinition, 0, 1)).toBe('steps.last');
  });
});
