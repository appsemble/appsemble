import { ModalCard } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactElement } from 'react';

import styles from './index.module.css';
import { type ShowDialogParams } from '../../types.js';
import { BlockList } from '../BlockList/index.js';

interface PageDialogProps
  extends Omit<ComponentPropsWithoutRef<typeof BlockList>, 'blocks' | 'prefix' | 'prefixIndex'> {
  dialog: ShowDialogParams;
}

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export function PageDialog({ dialog = null, remap, ...props }: PageDialogProps): ReactElement {
  return (
    <ModalCard
      cardClassName={classNames({ [styles.fullscreen]: dialog?.fullscreen })}
      closable={Boolean(dialog?.closable)}
      isActive={Boolean(dialog)}
      onClose={dialog?.close}
      title={remap(dialog?.title, {}, {})}
    >
      {dialog ? (
        <BlockList
          blocks={dialog.blocks}
          data={dialog.data}
          extraCreators={dialog.actionCreators}
          prefix={`${dialog.prefix}.blocks`}
          prefixIndex={`${dialog.prefixIndex}.blocks`}
          remap={remap}
          {...props}
        />
      ) : null}
    </ModalCard>
  );
}
