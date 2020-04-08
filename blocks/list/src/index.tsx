/** @jsx h */
import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import type { Item } from '../block';
import ListItem from './components/ListItem';
import styles from './index.css';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'No data.',
};

export default bootstrap(
  ({
    actions,
    parameters: { fields = [], header, base },
    data: blockData,
    events,
    ready,
    utils,
  }) => {
    const [data, setData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      let initialData = null;
      let shouldNotLoad = null;

      if (blockData != null) {
        if (base != null) {
          initialData = blockData[base];
        } else {
          initialData = blockData;
        }

        if (!Array.isArray(initialData)) {
          initialData = null;
        } else {
          shouldNotLoad = true;
        }

        if (initialData !== null) {
          setData(initialData);
        }

        if (shouldNotLoad) {
          setLoading(false);
        }
      }
    }, [base, blockData]);

    const loadData = useCallback(
      (d: any, err: string): void => {
        if (err) {
          setError(true);
        } else {
          if (base != null) {
            setData(d[base]);
          } else {
            setData(d);
          }
          setError(false);
        }
        setLoading(false);
      },
      [base],
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
          <li key={item.id ?? index}>
            <ListItem actions={actions} fields={fields} header={header} item={item} />
          </li>
        ))}
      </ul>
    );
  },
  messages,
);
