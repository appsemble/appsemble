import { defineMessages, type TypedMessageDescriptor } from '@formatjs/intl';

// `defineMessages` needs the index signature an interface lacks.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Values = {
  progress: Record<never, never>;
  step: { step: number; total: number };
};

export const messages: { [K in keyof Values]: TypedMessageDescriptor<Values[K]> } =
  defineMessages<Values>({
    progress: {
      id: 'app.sIMS7i',
      defaultMessage: 'Progress',
    },
    step: {
      id: 'app.7sbFrN',
      defaultMessage: 'Step {step} of {total}',
    },
  });
