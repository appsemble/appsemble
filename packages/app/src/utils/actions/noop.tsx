import type { BaseAction } from '@appsemble/sdk';

export default function noop(): BaseAction<'noop'> {
  return {
    type: 'noop',

    async dispatch(data: any) {
      return data;
    },
  };
}
