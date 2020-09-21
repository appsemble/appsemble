import { useBlock } from '@appsemble/preact';
import { h, VNode } from 'preact';

import type { RepeatedField } from '../../../block';
import { ItemCell } from '../ItemCell';

interface ItemRowProps {
  /**
   * The item to display a row of.
   */
  item: any;
}

function renderValue(value: unknown): String {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Render an item as a table row.
 */
export function ItemRow({ item }: ItemRowProps): VNode {
  const {
    parameters: { fields },
    utils,
  } = useBlock();

  const repeatedField = fields.find((field) => 'repeat' in field) as RepeatedField;
  if (repeatedField) {
    const repeatedItems = utils.remap(repeatedField.value, item) as any[];
    return (repeatedItems.map((repeatedItem, index) => (
      <tr key={repeatedItem.id || index}>
        {fields.map((field) =>
          field === repeatedField ? (
            repeatedField.repeat.map((repeatedCell) => (
              // eslint-disable-next-line react/jsx-key
              <ItemCell field={repeatedCell} item={item}>
                {renderValue(utils.remap(repeatedCell.value, repeatedItem))}
              </ItemCell>
            ))
          ) : index ? null : (
            <ItemCell field={field} item={item} rowSpan={repeatedItems.length}>
              {renderValue(utils.remap(field.value, item))}
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
        <ItemCell field={field} item={item}>
          {renderValue(utils.remap(field.value, item))}
        </ItemCell>
      ))}
    </tr>
  );
}
