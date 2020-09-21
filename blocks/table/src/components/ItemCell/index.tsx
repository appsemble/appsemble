import { useBlock } from '@appsemble/preact';
import { ComponentProps, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Field } from '../../../block';
import styles from './index.css';

interface ItemCellProps extends ComponentProps<'td'> {
  /**
   * The item to dislay.
   */
  item: any;

  /**
   * The field to render.
   */
  field: Field;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the subrow that was clicked.
   */
  repeatedIndex: number;
}

/**
 * Render an item value as a table cell.
 */
export function ItemCell({ field, index, item, repeatedIndex, ...props }: ItemCellProps): VNode {
  const { actions } = useBlock();

  const onClickAction = actions[field.onClick] || actions.onClick;

  const onCellClick = useCallback(() => {
    if (!onClickAction || onClickAction.type === 'noop') {
      return;
    }

    onClickAction.dispatch(item, { index, repeatedIndex });
  }, [onClickAction, item, index, repeatedIndex]);

  return (
    <td
      {...props}
      className={onClickAction?.type !== 'noop' && styles.clickable}
      onClick={onCellClick}
      role="gridcell"
    />
  );
}
