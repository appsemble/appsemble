/** @jsx h */
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import { Loader } from '@appsemble/preact-components';
import { remapData } from '@appsemble/utils';
import { h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Actions, Events, Parameters } from '../../../block';
import styles from './ListBlock.css';

interface Item {
  id?: number;
}

export default function ListBlock({
  actions,
  block: {
    parameters: { fields },
  },
  events,
  utils,
}: BlockProps<Parameters, Actions, Events>): VNode {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback((d: Item[]): void => {
    setData(d);
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
    utils.addCleanup(() => events.off.data(loadData));
  }, [events, loadData, utils]);

  if (loading) {
    return <Loader />;
  }

  if (!data.length) {
    return <FormattedMessage id="noData" />;
  }

  return (
    <table className="table is-hoverable is-striped is-fullwidth">
      <thead>
        <tr>
          {fields.map(field => (
            <th key={`header.${field.name}`}>{field.label || field.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, dataIndex) => (
          <tr
            key={item.id || dataIndex}
            className={actions.onClick.type !== 'noop' ? styles.clickable : undefined}
            onClick={() => onClick(item)}
          >
            {fields.map(field => {
              const value = remapData(field.name, item);

              return (
                <td key={field.name}>
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
