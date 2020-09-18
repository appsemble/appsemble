import { bootstrap } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { h } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { ItemCell } from './components/ItemCell';
import { ItemRow } from './components/ItemRow';
import styles from './index.css';

interface Item {
  id?: number;
}

bootstrap(
  ({
    actions,
    events,
    parameters: {
      emptyMessage = 'No data is available',
      errorMessage = 'An error occurred when fetching the data',
      fields,
    },
    ready,
    utils,
  }) => {
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

    useEffect(() => {
      events.on.data(loadData);
      ready();
    }, [events, loadData, ready, utils]);

    if (loading) {
      return <Loader />;
    }

    if (error) {
      return <p>{utils.remap(errorMessage, {})}</p>;
    }

    if (!data.length) {
      return <p>{utils.remap(emptyMessage, {})}</p>;
    }

    return (
      <table className="table is-hoverable is-striped is-fullwidth" role="grid">
        {fields.some((field) => field.label) && (
          <thead>
            <tr>
              {fields.map((field) => (
                <th key={field.value}>{utils.remap(field.label, {})}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((item, dataIndex) => (
            <ItemRow
              className={actions.onClick.type === 'noop' ? undefined : styles.clickable}
              item={item}
              key={item.id || dataIndex}
              onClick={actions.onClick}
            >
              {fields.map((field) => {
                const value = utils.remap(field.value, item);
                const onClickAction = actions[field.onClick] ?? actions.onClick;

                return (
                  <ItemCell
                    className={onClickAction?.type !== 'noop' && styles.clickable}
                    item={item}
                    key={field.value}
                    onClick={onClickAction}
                  >
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </ItemCell>
                );
              })}
            </ItemRow>
          ))}
        </tbody>
      </table>
    );
  },
);
