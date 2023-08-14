import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type Item } from '../../../block.js';
import { ButtonComponent } from '../Button/index.js';
import { DropdownComponent } from '../Dropdown/index.js';

interface ListItemProps {
  readonly index: number;
  readonly item: Item;
}

export function ListItem({ index, item }: ListItemProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, fields, header, icon, image },
    utils: { asset, remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

  const headerValue = remap(header, item);
  const img = remap(image, item) as string;

  const headerHTML = (
    <div className={classNames({ [styles.header]: fields?.length })}>
      {isPreactChild(icon) ? <Icon icon={icon} /> : null}
      {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
    </div>
  );

  const contentHTML = (field: any, label: any, value: any): VNode => (
    <span className={`${styles.itemField} mr-1 is-inline-block`}>
      {field.icon ? <Icon icon={field.icon} /> : null}
      {label == null ? null : (
        <span>
          {label}
          {value ? ': ' : null}
        </span>
      )}
      {value ? (
        <strong className="has-text-bold">
          {typeof value === 'string' ? value : JSON.stringify(value)}
        </strong>
      ) : null}
    </span>
  );

  return (
    <div className={`${styles.item} has-text-left is-block my-1 pt-4 pr-6 pb-4 pl-5`}>
      {img ? (
        <figure className={`image is-48x48 mr-2 ${styles.image}`}>
          <img alt="list icon" src={/^(https?:)?\/\//.test(img) ? img : asset(img)} />
        </figure>
      ) : null}
      <div className={`is-inline-block ${styles.headerWrapper}`}>
        {isPreactChild(icon) || isPreactChild(headerValue) ? (
          <>
            {actions.onClick.type === 'link' ? (
              <a className={styles.item} href={actions.onClick.href(item)}>
                {headerHTML}
              </a>
            ) : (
              <button className={styles.item} onClick={onItemClick} type="button">
                {headerHTML}
              </button>
            )}
            {button ? <ButtonComponent field={button} index={index} item={item} /> : null}
          </>
        ) : null}

        {fields?.map((field) => {
          let value;
          let label;

          if (field.value) {
            value = remap(field.value, item);
          }

          if (field.label) {
            label = remap(field.label, item);
          }

          return (
            // There is nothing that is guaranteed to be unique in these items.
            <Fragment key={0}>
              {actions.onClick.type === 'link' ? (
                <a className={styles.item} href={actions.onClick.href(item)}>
                  {contentHTML(field, label, value)}
                </a>
              ) : (
                <button className={styles.item} onClick={onItemClick} type="button">
                  {contentHTML(field, label, value)}
                </button>
              )}
              {dropdown ? (
                <DropdownComponent field={dropdown} index={index} item={item} record={item} />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      {actions.onClick.type !== 'noop' && button == null && (
        <Icon className={`${styles.button} mx-0 my-0 px-0 py-0`} icon="angle-right" size="large" />
      )}
    </div>
  );
}
