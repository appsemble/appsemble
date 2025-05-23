import { type Expect, mergeExpects } from '@playwright/test';

import { expect as trainingMatchers, type TrainingMatchers } from './training/index.js';

type ExpectFixtures = TrainingMatchers;

export const expect = mergeExpects(trainingMatchers) as Expect<ExpectFixtures>;
