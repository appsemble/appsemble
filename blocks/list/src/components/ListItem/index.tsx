import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { Item } from '../../../block';
import { ListItemWrapper } from '../ListItemWrapper';
import styles from './index.module.css';

interface ListItemProps {
  item: Item;
}

export function ListItem({ item }: ListItemProps): VNode {
  const {
    actions,
    parameters: { fields, header, icon, image },
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

  return (
    <ListItemWrapper
      actions={actions}
      className={`${styles.item} has-text-left is-block my-1 pt-4 pr-6 pb-4 pl-5`}
      item={item}
      onClick={onItemClick}
    >
      {img && (
        <figure className={`image is-48x48 mr-2 ${styles.image}`}>
          <img alt="list icon" src={/^(https?:)?\/\//.test(img) ? img : asset(img)} />
        </figure>
      )}
      <div className="is-inline-block">
        {(isPreactChild(icon) || isPreactChild(headerValue)) && (
          <div className={classNames({ [styles.header]: fields?.length })}>
            {isPreactChild(icon) ? <Icon icon={icon} /> : null}
            {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
          </div>
        )}
        {fields?.map((field) => {
          let value;

          if (field.value) {
            value = remap(field.value, item);
          }

          return (
            <span className={`${styles.itemField} mr-1 is-inline-block`} key={field.label}>
              {field.icon && <Icon icon={field.icon} />}
              {field.label && (
                <span>
                  {field.label}
                  {value && ': '}
                </span>
              )}
              {value && (
                <strong className="has-text-bold">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </strong>
              )}
            </span>
          );
        })}
      </div>
      {actions.onClick.type !== 'noop' && (
        <Icon className={`${styles.button} mx-0 my-0 px-0 py-0`} icon="angle-right" size="large" />
      )}
    </ListItemWrapper>
  );
}
