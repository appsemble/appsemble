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
    parameters: { collapseButton = {}, startCollapsed },
    utils: { formatMessage, isMobile },
  } = useBlock();
  const {
    collapseIcon = 'chevron-up',
    color = 'primary',
    expandIcon = 'chevron-down',
    inverted,
    light,
    outlined,
    rounded = true,
    size = isMobile ? 'small' : 'normal',
  } = collapseButton;

  const [collapsed, setCollapsed] = useState(index === 0 ? startCollapsed : true);

  const toggleCollapsed = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* The nested button is the keyboard accessible control, the bar is a larger click target. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={classNames(
          styles['toggle-button'],
          title ? 'is-justify-content-space-between' : 'is-justify-content-flex-end',
          'py-2 pl-3 pr-2',
        )}
        onClick={toggleCollapsed}
      >
        {title ? <span className={styles.title}>{title}</span> : null}
        <Button
          aria-expanded={!collapsed}
          aria-label={title || formatMessage('toggleList')}
          className={classNames(`is-${size}`, {
            'is-rounded': rounded,
            'is-light': light,
            'is-outlined': outlined,
          })}
          color={color}
          icon={collapsed ? expandIcon : collapseIcon}
          inverted={inverted}
          onClick={toggleCollapsed}
        />
      </div>
      {collapsed ? null : renderItems(items)}
    </>
  );
}
