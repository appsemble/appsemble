import { bootstrap } from '@appsemble/preact';
import { Icon, Loader } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { ItemRow } from './components/ItemRow/index.js';
import styles from './index.module.css';

interface Item {
  id?: number;
}

bootstrap(({ events, parameters: { borders, caption, fields, scrollable }, ready, utils }) => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: '',
    order: 'asc',
  });

  const remappedCaption = utils.remap(caption, {}) as string;

  const onTableHeaderClick = useCallback(
    (fieldName: string) => {
      if (order.field === fieldName) {
        switch (order.order) {
          case 'asc':
            setOrder({ field: fieldName, order: 'desc' });
            break;
          case 'desc':
            setOrder({ field: fieldName, order: 'asc' });
            break;
          default:
            setOrder({ field: fieldName, order: 'desc' });
            break;
        }
      } else {
        setOrder({ field: fieldName, order: 'asc' });
      }
    },
    [order],
  );

  useEffect(() => {
    events.emit.sorted(order);
  }, [events.emit, order]);

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
                className={`${header?.name ? styles.pointer : ''} ${header?.name && header.name === order.field ? 'has-background-warning' : ''}`}
                key={header?.label}
                {...(header?.name ? { onClick: () => onTableHeaderClick(header.name) } : {})}
              >
                {header.label as string}
                <span className="ml-1">
                  {header.name && header.name === order.field ? (
                    <Icon icon={order.order === 'asc' ? 'arrow-up' : 'arrow-down'} size="small" />
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
  }, [fields, onTableHeaderClick, order, utils]);

  useEffect(() => {
    const callback = (d: Item | Item[], err: string): void => {
      if (err) {
        setError(true);
      } else {
        const items = Array.isArray(d) ? d : [d];
        const filteredItems = items.filter((item) => item != null);
        setData(filteredItems);
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
    <div {...(scrollable ? { className: 'table-container' } : {})}>
      <table
        className={classNames(
          'table is-hoverable is-striped is-fullwidth',
          borders && 'is-bordered',
        )}
        role="grid"
      >
        {remappedCaption ? (
          <caption className="is-size-5 mb-2 p-1">{remappedCaption}</caption>
        ) : null}
        {headers}
        <tbody>
          {data.map((item, index) => (
            <ItemRow index={index} item={item} key={item.id || index} />
          ))}
        </tbody>
      </table>
    </div>
  );
});
