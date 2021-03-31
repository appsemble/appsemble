import { BaseAction } from '@appsemble/sdk';
import { DialogActionDefinition } from '@appsemble/types';

import { MakeActionParameters } from '../../types';

export function dialog({
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
              // eslint-disable-next-line require-await
              async dispatch(error) {
                reject(error);
                close();
                return error;
              },
            }),
            'dialog.ok': () => ({
              type: 'dialog.ok',
              // eslint-disable-next-line require-await
              async dispatch(result) {
                resolve(result);
                close();
                return result;
              },
            }),
          },
          blocks: definition.blocks,
          closable: definition.closable ?? true,
          data,
          close() {
            reject(new Error('closed'));
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
