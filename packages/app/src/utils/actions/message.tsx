import type { BaseAction } from '@appsemble/sdk';
import type { MessageActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';

export default function message({
  definition,
  remap,
  showMessage,
}: MakeActionParameters<MessageActionDefinition>): BaseAction<'message'> {
  const { body, color = 'info', dismissable, timeout } = definition;

  return {
    type: 'message',
    async dispatch(data: any) {
      showMessage({ body: remap(body, data), color, dismissable, timeout });
      return data;
    },
  };
}
