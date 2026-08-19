import { type LoopPageDefinition } from '@appsemble/lang-sdk';
import { describe, expect, it } from 'vitest';

import { createLoopSteps } from './createLoopSteps.js';

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

    expect(result.steps).toEqual([
      start,
      { ...foreach, name: 'New loop page' },
      { ...foreach, name: 'New loop page' },
      end,
    ]);
    expect(result.loopData).toEqual([undefined, ...questions, undefined]);
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

    expect(result.steps).toEqual([
      { ...foreach, name: 'New loop page' },
      { ...foreach, name: 'New loop page' },
    ]);
    expect(result.loopData).toEqual(questions);
  });
});
