/** @jsx h */
import { Icon } from '@appsemble/preact-components';
import { BootstrapParams } from '@appsemble/sdk';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { Field, Item } from '../../../block';
import ListItemWrapper from '../ListItemWrapper';
import styles from './index.css';

interface ListItemProps {
  actions: BootstrapParams['actions'];
  fields: Field[];
  header: string;
  item: Item;
}

export default function ListItem({ actions, fields, header, item }: ListItemProps): VNode {
  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick.dispatch(item);
    },
    [actions, item],
  );

  return (
    <ListItemWrapper actions={actions} className={styles.item} item={item} onClick={onItemClick}>
      {header && <h4>{remapData(header, item)}</h4>}
      {fields.map((field) => {
        let value;

        if (field.name) {
          value = remapData(field.name, item);
        }

        return (
          <span key={field.name} className={styles.itemField}>
            {field.icon && <Icon icon={field.icon} />}
            {field.label && (
              <span>
                {field.label}
                {field.name && ': '}
              </span>
            )}
            {field.name && (
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
