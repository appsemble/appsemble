import { bootstrap } from '@appsemble/preact';
import { Icon, Loader } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { ItemRow } from './components/ItemRow/index.js';
import styles from './index.module.css';

interface Item {
  id?: number;
}

bootstrap(({ events, parameters: { caption, fields }, ready, utils }) => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<'asc' | 'default' | 'desc'>('default');
  const [loadedData, setLoadedData] = useState<Item[]>([]);
  const [highlighted, setHighlighted] = useState<String>();

  const remappedCaption = utils.remap(caption, {}) as string;
  const onTableHeaderClick = useCallback(
    (fieldName: string) => {
      if (order === 'desc') {
        setData(loadedData);
        setOrder('default');
        setHighlighted('');
        return;
      }
      const sortedData = ([...data] as any[]).sort((a, b) => {
        const aFieldName = a[fieldName];
        const bFieldName = b[fieldName];
        if (typeof aFieldName === 'string' && typeof bFieldName === 'string') {
          return aFieldName.localeCompare(bFieldName);
        }
        if (typeof aFieldName === 'number' && typeof bFieldName === 'number') {
          return a - b;
        }
        if (typeof aFieldName === 'boolean' && typeof bFieldName === 'boolean') {
          return Number(aFieldName) - Number(bFieldName);
        }
      });
      if (order === 'default') {
        setData(sortedData);
        setOrder('asc');
        setHighlighted(fieldName);
      } else {
        setData(sortedData.reverse());
        setOrder('desc');
        setHighlighted(fieldName);
      }
    },
    [data, order, loadedData],
  );

  const headers = useMemo<VNode>(() => {
    const heads = fields.flatMap((field) => {
      if ('label' in field) {
        return {
          label: utils.remap(field.label, {}),
          name: field.name ?? '',
        };
      }

      if ('repeat' in field) {
        return field.repeat.map((subField) => ({
          label: utils.remap(subField.label, {}),
          name: subField.name,
        }));
      }
    });

    // Don’t render any headers if none of the headers have labels
    if (!heads.some(Boolean)) {
      return;
    }

    return (
      <thead>
        <tr>
          {heads.map((header) =>
            header ? (
              <th
                className={`${styles.pointer} ${header?.name === highlighted ? 'has-background-warning' : ''}`}
                key={header?.label}
                onClick={() => onTableHeaderClick(header?.name)}
              >
                {header.label as string}
                <span className="ml-1">
                  {header.name ? (
                    <Icon
                      icon={
                        order === 'default'
                          ? 'arrows-up-down'
                          : order === 'asc'
                            ? 'arrow-up'
                            : 'arrow-down'
                      }
                      size="small"
                    />
                  ) : null}
                </span>
              </th>
            ) : (
              ''
            ),
          )}
        </tr>
      </thead>
    );
  }, [fields, highlighted, onTableHeaderClick, order, utils]);

  useEffect(() => {
    const callback = (d: Item | Item[], err: string): void => {
      if (err) {
        setError(true);
      } else {
        const items = Array.isArray(d) ? d : [d];
        const filteredItems = items.filter((item) => item != null);
        setData(filteredItems);
        setLoadedData(filteredItems);
        setError(false);
      }
      setLoading(false);
    };
    events.on.data(callback);
    ready();
    return () => events.off.data(callback);
  }, [events, ready, utils]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <p className="px-2 py-2 has-text-centered">{utils.formatMessage('error')}</p>;
  }

  if (!data.length) {
    return <p className="px-2 py-2 has-text-centered">{utils.formatMessage('emptyMessage')}</p>;
  }

  return (
    <table className="table is-hoverable is-striped is-fullwidth" role="grid">
      {remappedCaption ? <caption className="is-size-5 mb-2 p-1">{remappedCaption}</caption> : null}
      {headers}
      <tbody>
        {data.map((item, index) => (
          <ItemRow index={index} item={item} key={item.id || index} />
        ))}
      </tbody>
    </table>
  );
});
