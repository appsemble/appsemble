import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../../block.js';
import { ButtonComponent } from '../../Button/index.js';
import { DropdownComponent } from '../../Dropdown/index.js';
import { ToggleButtonComponent } from '../../ToggleButton/index.js';
import { Image } from '../Image/index.js';

interface HeaderComponentProps {
  readonly index: number;
  readonly item: Item;
}

export function HeaderComponent({ index, item }: HeaderComponentProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, fields, header, icon, image, toggleButton },
    utils: { remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

  const headerValue = remap(header, item);

  const headerHTML = (
    <div className={classNames({ [styles.header]: fields?.length })}>
      {isPreactChild(icon) ? <Icon icon={icon} /> : null}
      {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
    </div>
  );

  return (
    <div className={`${styles.headerWrapper} is-flex`}>
      <div className={`is-flex ${styles.image}`}>
        <div>
          {image && image.alignment === 'header' ? (
            <Image field={image} index={index} item={item} />
          ) : null}
        </div>
        {actions.onClick.type === 'link' ? (
          <a className={`${styles.item} has-text-left is-block`} href={actions.onClick.href(item)}>
            {headerHTML}
          </a>
        ) : (
          <button
            className={`${styles.item} has-text-left is-block`}
            onClick={onItemClick}
            type="button"
          >
            {headerHTML}
          </button>
        )}
      </div>
      {button && button.alignment === 'top-right' ? (
        <ButtonComponent field={button} index={index} item={item} />
      ) : null}
      {toggleButton ? (
        <ToggleButtonComponent field={toggleButton} index={index} item={item} />
      ) : null}
      {dropdown && dropdown.alignment === 'top-right' ? (
        <div className={styles.dropdown}>
          <DropdownComponent field={dropdown} index={index} item={item} record={item} />
        </div>
      ) : null}
    </div>
  );
}
