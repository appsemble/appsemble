import { Modal } from '@appsemble/react-components';
import { Block } from '@appsemble/types';
import classNames from 'classnames';
import React, { useEffect } from 'react';

import { ShowDialogParams } from '../../types';
import BlockList from '../BlockList';
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
}: PageDialogProps & React.ComponentPropsWithoutRef<typeof BlockList>): React.ReactElement {
  useEffect(() => {
    if (dialog) {
      getBlockDefs(dialog.blocks);
    }
  });

  return (
    <Modal
      cardClassName={classNames({ [styles.fullscreen]: dialog && dialog.fullscreen })}
      closable={dialog && dialog.closable}
      isActive={!!dialog}
      onClose={dialog && dialog.close}
      title={dialog && dialog.title}
    >
      {dialog && (
        <BlockList
          actionCreators={dialog.actionCreators}
          blocks={dialog.blocks}
          data={dialog.data}
          {...props}
        />
      )}
    </Modal>
  );
}
