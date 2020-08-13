import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type ItemRowProps = { item: any; onClick: (item: any) => void } & h.JSX.HTMLAttributes<
  HTMLTableRowElement
>;

export function ItemRow({ children, className, item, onClick }: ItemRowProps): VNode {
  const onRowClick = useCallback(() => onClick(item), [item, onClick]);

  return (
    <tr className={className} onClick={onRowClick}>
      {children}
    </tr>
  );
}
