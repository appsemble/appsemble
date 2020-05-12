import { Icon } from '@appsemble/preact-components';
import { useBlock } from '@appsemble/preact/src';
import type { BootstrapParams, Remapper } from '@appsemble/sdk';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Field, Item } from '../../../block';
import ListItemWrapper from '../ListItemWrapper';
import styles from './index.css';

interface ListItemProps {
  actions: BootstrapParams['actions'];
  fields: Field[];
  header: Remapper;
  item: Item;
}

export default function ListItem({ actions, fields, header, item }: ListItemProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick.dispatch(item);
    },
    [actions, item],
  );

  const headerValue = remap(header, item);

  return (
    <ListItemWrapper actions={actions} className={styles.item} item={item} onClick={onItemClick}>
      {headerValue && <h4>{headerValue}</h4>}
      {fields.map((field) => {
        let value;

        if (field.value) {
          value = remap(field.value, item);
        }

        return (
          <span className={styles.itemField}>
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
      {actions.onClick.type !== 'noop' && (
        <Icon className={styles.button} icon="angle-right" size="large" />
      )}
    </ListItemWrapper>
  );
}
