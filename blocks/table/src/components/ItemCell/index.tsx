import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import {
  type Button,
  type Dropdown as DropdownType,
  type Field,
  type Image,
  type StringField,
} from '../../../block.js';
import { ButtonField } from '../ButtonField/index.js';
import { DropdownField } from '../DropdownField/index.js';
import { ImageField } from '../ImageField/index.js';
import { StringInput } from '../StringInput/index.js';

interface ItemCellProps extends ComponentProps<'td'> {
  /**
   * The item to display.
   */
  readonly item: unknown;

  /**
   * The data of the record that item is a part of.
   */
  readonly record: unknown;

  /**
   * The field to render.
   */
  readonly field: Button | DropdownType | Field | Image | StringField;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The index of the sub row that was clicked.
   */
  readonly repeatedIndex: number;
}

function renderValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Render an item value as a table cell.
 */
export function ItemCell({
  field,
  index,
  item,
  record,
  repeatedIndex,
  ...props
}: ItemCellProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();

  const onClickAction =
    !('dropdown' in field) &&
    !('button' in field) &&
    !('string' in field) &&
    !('image' in field) &&
    (actions[field.onClick] || actions.onClick);

  const onCellClick = useCallback(() => {
    if (!onClickAction || onClickAction.type === 'noop') {
      return;
    }

    onClickAction(record, { index, repeatedIndex });
  }, [onClickAction, record, index, repeatedIndex]);

  const alignment = field.alignment || 'left';
  let content: VNode | string;
  if ('dropdown' in field) {
    content = (
      <DropdownField
        field={field}
        index={index}
        item={item}
        record={record}
        repeatedIndex={repeatedIndex}
      />
    );
  } else if ('button' in field) {
    content = <ButtonField field={field} index={index} item={item} repeatedIndex={repeatedIndex} />;
  } else if ('string' in field) {
    content = <StringInput field={field} index={index} item={item} repeatedIndex={repeatedIndex} />;
  } else if ('image' in field) {
    content = <ImageField field={field} index={index} item={item} repeatedIndex={repeatedIndex} />;
  } else {
    content = renderValue(remap(field.value, item, { index, repeatedIndex }));
  }

  return (
    <td
      {...props}
      className={onClickAction?.type !== 'noop' && styles.clickable}
      onClick={onCellClick}
      role="gridcell"
    >
      <div
        className={classNames(
          `is-flex is-justify-content-${alignment}`,
          'string' in field && styles.editable,
        )}
      >
        {content}
      </div>
    </td>
  );
}
