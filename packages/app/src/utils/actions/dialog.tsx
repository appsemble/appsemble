import type { BaseAction } from '@appsemble/sdk';
import type { DialogActionDefinition } from '@appsemble/types';

import type { MakeActionParameters } from '../../types';

export default function dialog({
  definition,
  prefix,
  showDialog,
}: MakeActionParameters<DialogActionDefinition>): BaseAction<'dialog'> {
  return {
    type: 'dialog',
    dispatch(data) {
      return new Promise((resolve, reject) => {
        const close = showDialog({
          actionCreators: {
            'dialog.error': () => ({
              type: 'dialog.error',
              async dispatch(error) {
                reject(error);
                close();
              },
            }),
            'dialog.ok': () => ({
              type: 'dialog.ok',
              async dispatch(result) {
                resolve(result);
                close();
              },
            }),
          },
          blocks: definition.blocks,
          closable: definition.closable,
          data,
          close() {
            reject();
            close();
          },
          fullscreen: definition.fullscreen,
          prefix,
          title: definition.title,
        });
      });
    },
  };
}
