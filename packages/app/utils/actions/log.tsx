import { Action } from '@appsemble/sdk';

interface LogDefinition {
  level: 'error' | 'warn' | 'info';
}

export default function log({
  definition,
}: {
  definition: LogDefinition;
}): Action & { level: LogDefinition['level'] } {
  const { level = 'info' } = definition;

  return {
    async dispatch(...args) {
      // eslint-disable-next-line no-console
      console[level](...args);
    },
    level,
  };
}
