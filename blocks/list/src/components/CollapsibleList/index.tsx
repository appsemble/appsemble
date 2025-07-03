import { useBlock } from '@appsemble/preact';
import { Button } from '@appsemble/preact-components';
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
    utils: { isMobile },
  } = useBlock();

  const [collapsed, setCollapsed] = useState(index === 0 ? startCollapsed : true);

  const toggleCollapsed = (): void => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <div
        className={classNames(
          styles['toggle-button'],
          title ? 'is-justify-content-space-between' : 'is-justify-content-flex-end',
          'py-2 pl-3 pr-2',
        )}
      >
        {title ? <span className={styles.title}>{title}</span> : null}
        <Button
          className={classNames(`is-${isMobile ? 'small' : 'normal'} is-rounded is-primary`)}
          icon={collapsed ? 'chevron-down' : 'chevron-up'}
          onClick={toggleCollapsed}
        />
      </div>
      {collapsed ? null : renderItems(items)}
    </>
  );
}
