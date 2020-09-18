import type { Action } from '@appsemble/sdk';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type ItemCellProps = {
  item: any;
  onClick: Action;
} & Omit<h.JSX.HTMLAttributes<HTMLTableCellElement>, 'onClick'>;

export function ItemCell({ children, className, item, onClick }: ItemCellProps): VNode {
  const onCellClick = useCallback(
    (event: Event) => {
      if (onClick === undefined) {
        return;
      }

      // Prevent row click event from happening
      event.stopPropagation();
      onClick.dispatch(item);
    },
    [item, onClick],
  );

  return (
    <td className={className} onClick={onCellClick} role="gridcell">
      {children}
    </td>
  );
}
