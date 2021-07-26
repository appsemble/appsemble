import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  capture: 'viewport',
  failureThreshold: 0,
  failureThresholdType: 'percent',
  customDiffConfig: { threshold: 0 },
});
