import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';

import styles from './index.module.css';
import { ModalCard } from '../ModalCard/index.js';
import { type ShowDialogParams } from '../../types.js';
import { BlockList } from '../BlockList/index.js';

interface PageDialogProps extends Omit<
  ComponentProps<typeof BlockList>,
  'blocks' | 'prefix' | 'prefixIndex'
> {
  readonly dialog?: ShowDialogParams;
}

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export function PageDialog({ dialog, remap, ...props }: PageDialogProps): VNode {
  return (
    <ModalCard
      cardClassName={classNames({ [styles.fullscreen]: dialog?.fullscreen })}
      closable={Boolean(dialog?.closable)}
      isActive={Boolean(dialog)}
      onClose={dialog?.close}
      title={remap(dialog?.title ?? null, dialog?.data ?? {}, {})}
    >
      {dialog ? (
        <BlockList
          blocks={dialog.blocks}
          data={dialog.data}
          extraCreators={dialog.actionCreators}
          prefix={`${dialog.prefix}.blocks`}
          prefixIndex={`${dialog.prefixIndex}.blocks`}
          remap={remap}
          signal={dialog.signal}
          {...props}
        />
      ) : null}
    </ModalCard>
  );
}
