import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../block.js';

interface CollapsibleListComponentProps {
  readonly index: number;
  readonly title?: string;
  readonly items: Item[];
  readonly renderItems: (items: Item[], spaced?: boolean) => VNode;
}

export function CollapsibleListComponent({
  index,
  items,
  renderItems,
  title,
}: CollapsibleListComponentProps): VNode {
  const {
    parameters: { startCollapsed },
  } = useBlock();

  const [collapsed, setCollapsed] = useState(index === 0 ? startCollapsed : true);

  const toggleCollapsed = (): void => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <button
        className={classNames(
          styles['toggle-button'],
          title ? 'is-justify-content-space-between' : 'is-justify-content-flex-end',
        )}
        onClick={toggleCollapsed}
        type="button"
      >
        {title ? <span className={styles.title}>{title}</span> : null}
        <Icon icon={collapsed ? 'caret-down' : 'caret-up'} />
      </button>
      {collapsed ? null : renderItems(items)}
    </>
  );
}
