import { BaseAction } from '@appsemble/sdk';

export default function noop(): BaseAction<'noop'> {
  return {
    type: 'noop',
    // eslint-disable-next-line no-empty-function
    async dispatch() {},
  };
}
