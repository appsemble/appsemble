/** @jsx h */
import { BlockProps, bootstrap, FormattedMessage } from '@appsemble/preact';
import { Icon, Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Actions, Events, Parameters } from '../block';
import styles from './index.css';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'No data.',
};
interface Item {
  id?: number;
  [property: string]: any;
}

bootstrap(
  ({
    actions,
    block: {
      parameters: { fields, header },
    },
    events,
    ready,
    utils,
  }: BlockProps<Parameters, Actions, Events>): VNode => {
    const [data, setData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = useCallback((d: Item[], err: string): void => {
      if (err) {
        setError(true);
      } else {
        setData(d);
        setError(false);
      }
      setLoading(false);
    }, []);

    const onClick = useCallback(
      (d: Item): void => {
        if (actions.onClick) {
          actions.onClick.dispatch(d);
        }
      },
      [actions],
    );

    useEffect(() => {
      events.on.data(loadData);
      ready();
    }, [events, loadData, ready, utils]);

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return <FormattedMessage id="error" />;
    }

    if (!data.length) {
      return <FormattedMessage id="noData" />;
    }

    return (
      <ul className={styles.container}>
        {data.map((item, index) => (
          <li key={item.id ?? index} className={styles.item}>
            {header && <h4>{remapData(header, item)}</h4>}
            {fields.map(field => {
              const value = remapData(field.name, item);

              return (
                <span key={field.name} className={styles.itemField}>
                  {field.icon && <Icon icon={field.icon} />}
                  {field.label && <span>{field.label}: </span>}
                  <strong>{typeof value === 'string' ? value : JSON.stringify(value)}</strong>
                </span>
              );
            })}
            {actions.onClick.type !== 'noop' && (
              <button className={`button ${styles.button}`} onClick={onClick} type="button">
                <Icon icon="angle-right" size="large" />
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  },
  messages,
);
