import { useBlock } from '@appsemble/preact';
import { Dropdown } from '@appsemble/preact-components';
import { ComponentProps, Fragment, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { Dropdown as DropdownType, Field } from '../../../block';
import { DropdownOption } from '../DropdownOption';
import styles from './index.module.css';

interface ItemCellProps extends ComponentProps<'td'> {
  /**
   * The item to dislay.
   */
  item: unknown;

  /**
   * The data of the record that item is a part of.
   */
  record: unknown;

  /**
   * The field to render.
   */
  field: DropdownType | Field;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the subrow that was clicked.
   */
  repeatedIndex: number;
}

function renderValue(value: unknown): String {
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

  const onClickAction = !('dropdown' in field) && (actions[field.onClick] || actions.onClick);

  const onCellClick = useCallback(() => {
    if (!onClickAction || onClickAction.type === 'noop') {
      return;
    }

    onClickAction(record, { index, repeatedIndex });
  }, [onClickAction, record, index, repeatedIndex]);

  return (
    <td
      {...props}
      className={onClickAction?.type !== 'noop' && styles.clickable}
      onClick={onCellClick}
      role="gridcell"
    >
      {'dropdown' in field ? (
        <Dropdown
          className="is-right"
          icon={field.dropdown.icon}
          label={remap(field.dropdown.label, item, { index, repeatedIndex }) as string}
        >
          {field.dropdown.options.map((option, i) => {
            const label = remap(option.label, item, { index, repeatedIndex });

            return (
              <Fragment key={label || i}>
                {i ? <hr className="dropdown-divider" /> : null}
                <DropdownOption
                  index={index}
                  item={item}
                  option={option}
                  record={record}
                  repeatedIndex={repeatedIndex}
                />
              </Fragment>
            );
          })}
        </Dropdown>
      ) : (
        renderValue(remap(field.value, item, { index, repeatedIndex }))
      )}
    </td>
  );
}
