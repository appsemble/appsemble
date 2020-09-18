import type { Action } from '@appsemble/sdk';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type ItemRowProps = { item: any; onClick: Action } & Omit<
  h.JSX.HTMLAttributes<HTMLTableRowElement>,
  'onClick'
>;

export function ItemRow({ children, className, item, onClick }: ItemRowProps): VNode {
  const onRowClick = useCallback(() => {
    if (onClick.type === 'noop') {
      return;
    }

    return onClick.dispatch(item);
  }, [item, onClick]);

  return (
    <tr className={className} onClick={onRowClick}>
      {children}
    </tr>
  );
}
