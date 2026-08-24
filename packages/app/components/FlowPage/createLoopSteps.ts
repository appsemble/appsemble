import { type LoopPageDefinition, type SubPageDefinition } from '@appsemble/lang-sdk';

export interface LoopSteps {
  loopData: (object | undefined)[];
  steps: SubPageDefinition[];
}

export function appendLoopResult(
  results: object[],
  loopItem: object | undefined,
  data: object,
): object[] {
  return loopItem ? [...results, { ...loopItem, ...data }] : results;
}

export function getLoopStepPrefix(
  pageDefinition: LoopPageDefinition,
  currentStep: number,
  stepCount: number | undefined,
): 'steps' | 'steps.first' | 'steps.last' {
  if (pageDefinition.start && currentStep === 0) {
    return 'steps.first';
  }
  if (pageDefinition.end && stepCount === currentStep + 1) {
    return 'steps.last';
  }
  if (currentStep === 0) {
    return 'steps.first';
  }
  if (stepCount === currentStep + 1) {
    return 'steps.last';
  }
  return 'steps';
}

export function createLoopSteps(pageDefinition: LoopPageDefinition, results: object[]): LoopSteps {
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
