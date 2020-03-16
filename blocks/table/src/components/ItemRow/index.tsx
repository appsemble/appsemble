/** @jsx h */
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type ItemRowProps = { item: any; onClick: (item: any) => void } & h.JSX.HTMLAttributes<
  HTMLTableRowElement
>;

export default function ItemRow({ children, item, onClick }: ItemRowProps): VNode {
  const onRowClick = useCallback(() => onClick(item), [item, onClick]);

  return <tr onClick={onRowClick}>{children}</tr>;
}
