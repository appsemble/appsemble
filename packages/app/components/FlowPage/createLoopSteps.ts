import { type LoopPageDefinition, type SubPageDefinition } from '@appsemble/lang-sdk';

export interface LoopSteps {
  loopData: (object | undefined)[];
  steps: SubPageDefinition[];
}

export function createLoopSteps(
  pageDefinition: LoopPageDefinition,
  results: object[],
): LoopSteps {
  const loopData: (object | undefined)[] = [];
  const steps: SubPageDefinition[] = [];

  if (pageDefinition.start) {
    loopData.push(undefined);
    steps.push(pageDefinition.start);
  }

  for (const resourceData of results) {
    if (resourceData) {
      loopData.push(resourceData);
      steps.push({
        ...pageDefinition.foreach,
        name: 'New loop page',
      });
    }
  }

  if (pageDefinition.end) {
    loopData.push(undefined);
    steps.push(pageDefinition.end);
  }

  return { loopData, steps };
}
