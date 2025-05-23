import { mergeTests } from '@playwright/test';

import { test as appFixtures } from './app/index.js';
import { test as appCollectionFixtures } from './app-collection/index.js';
import { test as demoAppFixtures } from './demo-app/index.js';
import { test as groupFixtures } from './group/index.js';
import { test as liveAppFixtures } from './live-app/index.js';
import { test as resourceFixtures } from './resource/index.js';
import { test as studioFixtures } from './studio/index.js';
import { test as trainingFixtures } from './training/index.js';

export const test = mergeTests(
  appFixtures,
  appCollectionFixtures,
  demoAppFixtures,
  groupFixtures,
  liveAppFixtures,
  resourceFixtures,
  studioFixtures,
  trainingFixtures,
);
