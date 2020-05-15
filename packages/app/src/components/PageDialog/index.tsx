import { Modal } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';

import type { ShowDialogParams } from '../../types';
import BlockList from '../BlockList';
import styles from './index.css';

interface PageDialogProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BlockList>, 'blocks' | 'prefix'> {
  dialog: ShowDialogParams;
}

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export default function PageDialog({
  dialog = null,
  ...props
}: PageDialogProps): React.ReactElement {
  return (
    <Modal
      cardClassName={classNames({ [styles.fullscreen]: dialog?.fullscreen })}
      closable={!!dialog?.closable}
      isActive={!!dialog}
      onClose={dialog?.close}
      title={dialog?.title}
    >
      {dialog && (
        <BlockList
          blocks={dialog.blocks}
          data={dialog.data}
          extraCreators={dialog.actionCreators}
          prefix={`${dialog.prefix}.blocks`}
          {...props}
        />
      )}
    </Modal>
  );
}
