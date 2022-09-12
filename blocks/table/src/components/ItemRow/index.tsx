import { useBlock } from '@appsemble/preact';
import { VNode } from 'preact';

import { RepeatedField } from '../../../block.js';
import { ItemCell } from '../ItemCell/index.js';

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
    return repeatedItems.map((repeatedItem, repeatedIndex) => (
      <tr key={repeatedItem.id || repeatedIndex}>
        {fields.map((field) =>
          field === repeatedField ? (
            repeatedField.repeat.map((repeatedCell) => (
              // eslint-disable-next-line react/jsx-key
              <ItemCell
                field={repeatedCell}
                index={index}
                item={repeatedItem}
                record={item}
                repeatedIndex={repeatedIndex}
              />
            ))
          ) : repeatedIndex ? null : (
            <ItemCell
              field={field}
              index={index}
              item={item}
              record={item}
              repeatedIndex={0}
              rowSpan={repeatedItems.length}
            />
          ),
        )}
      </tr>
    )) as unknown as VNode;
  }

  return (
    <tr>
      {fields.map((field) => (
        // eslint-disable-next-line react/jsx-key
        <ItemCell field={field} index={index} item={item} record={item} repeatedIndex={0} />
      ))}
    </tr>
  );
}
