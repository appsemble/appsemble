/** @jsx h */
import type { Field } from 'blocks/table/block';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type ItemCellProps = {
  item: any;
  field: Field;
  onClick: (item: any) => void;
} & h.JSX.HTMLAttributes<HTMLTableCellElement>;

export default function ItemCell({
  children,
  className,
  field,
  item,
  onClick,
}: ItemCellProps): VNode {
  const onCellClick = useCallback(
    (event: Event) => {
      if (field.onClick === undefined) {
        return;
      }

      // Prevent row click event from happening
      event.stopPropagation();
      onClick(item);
    },
    [item, field, onClick],
  );

  return (
    <td className={className} onClick={onCellClick} role="gridcell">
      {children}
    </td>
  );
}
