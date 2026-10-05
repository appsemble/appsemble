import { useBlock } from '@appsemble/preact';
import { Button, Icon } from '@appsemble/preact-components';
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
    utils: { formatMessage, isMobile, remap },
  } = useBlock();
  const {
    collapseIcon,
    collapseLabel,
    color = 'primary',
    expandIcon,
    expandLabel,
    iconPosition = 'left',
    inverted,
    light,
    outlined,
    rounded = true,
    size = isMobile ? 'small' : 'normal',
  } = collapseButton;

  const [collapsed, setCollapsed] = useState(index === 0 ? startCollapsed : true);

  const label = isMobile
    ? null
    : (remap(collapsed ? expandLabel : collapseLabel, items, { index }) as string);
  const definedIcon = collapsed ? expandIcon : collapseIcon;
  // A labelled button only shows an icon the app defines, an icon-only button falls back to a chevron.
  const icon = label ? definedIcon : (definedIcon ?? (collapsed ? 'chevron-down' : 'chevron-up'));

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
          aria-label={label ? undefined : title || formatMessage('toggleList')}
          className={classNames(styles.button, `is-${size}`, {
            'is-rounded': rounded,
            'is-light': light,
            'is-outlined': outlined,
          })}
          color={color}
          inverted={inverted}
          onClick={toggleCollapsed}
        >
          {icon && iconPosition === 'left' ? <Icon icon={icon} /> : null}
          {label ? <span>{label}</span> : null}
          {icon && iconPosition === 'right' ? <Icon icon={icon} /> : null}
        </Button>
      </div>
      {collapsed ? null : renderItems(items)}
    </>
  );
}
