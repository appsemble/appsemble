import { Modal } from '@appsemble/react-components';
import { Block } from '@appsemble/types';
import classNames from 'classnames';
import React, { useEffect } from 'react';

import { ShowDialogParams } from '../../types';
import BlockList, { BlockListProps } from '../BlockList';
import styles from './PageDialog.css';

export interface PageDialogProps {
  dialog: ShowDialogParams;
  getBlockDefs: (blocks: Block[]) => Promise<void>;
}

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export default function PageDialog({
  dialog = null,
  getBlockDefs,
  ...props
}: PageDialogProps & BlockListProps): React.ReactElement {
  useEffect(() => {
    if (dialog) {
      getBlockDefs(dialog.blocks);
    }
  });

  return (
    <Modal isActive={!!dialog} onClose={dialog && dialog.close} title={dialog && dialog.title}>
      {dialog && (
        <div className={classNames({ [styles.fullscreen]: dialog.fullscreen })}>
          <BlockList
            actionCreators={dialog.actionCreators}
            blocks={dialog.blocks}
            data={dialog.data}
            {...props}
          />
        </div>
      )}
    </Modal>
  );
}
