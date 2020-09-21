import { useBlock } from '@appsemble/preact';
import { h, VNode } from 'preact';

import type { RepeatedField } from '../../../block';
import { ItemCell } from '../ItemCell';

interface ItemRowProps {
  /**
   * The item to display a row of.
   */
  item: any;

  /**
   * The index of the item being rendered.
   */
  index: number;
}

function renderValue(value: unknown): String {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Render an item as a table row.
 */
export function ItemRow({ index, item }: ItemRowProps): VNode {
  const {
    parameters: { fields },
    utils,
  } = useBlock();

  const repeatedField = fields.find((field) => 'repeat' in field) as RepeatedField;
  if (repeatedField) {
    const repeatedItems = utils.remap(repeatedField.value, item) as any[];
    return (repeatedItems.map((repeatedItem, repeatedIndex) => (
      <tr key={repeatedItem.id || repeatedIndex}>
        {fields.map((field) =>
          field === repeatedField ? (
            repeatedField.repeat.map((repeatedCell) => (
              // eslint-disable-next-line react/jsx-key
              <ItemCell
                field={repeatedCell}
                index={index}
                item={item}
                repeatedIndex={repeatedIndex}
              >
                {renderValue(
                  utils.remap(repeatedCell.value, repeatedItem, { repeatedIndex, index }),
                )}
              </ItemCell>
            ))
          ) : repeatedIndex ? null : (
            <ItemCell
              field={field}
              index={index}
              item={item}
              repeatedIndex={0}
              rowSpan={repeatedItems.length}
            >
              {renderValue(utils.remap(field.value, item, { index, repeatedIndex: 0 }))}
            </ItemCell>
          ),
        )}
      </tr>
    )) as unknown) as VNode;
  }

  return (
    <tr>
      {fields.map((field) => (
        // eslint-disable-next-line react/jsx-key
        <ItemCell field={field} index={index} item={item} repeatedIndex={0}>
          {renderValue(utils.remap(field.value, item, { index, repeatedIndex: 0 }))}
        </ItemCell>
      ))}
    </tr>
  );
}
