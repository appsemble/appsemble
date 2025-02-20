import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { CollapsibleListComponent } from './components/CollapsibleList/index.js';
import { ListItem } from './components/ListItem/index.js';
import styles from './index.module.css';
import { type Item } from '../block.js';

export const renderItems = (items: Item[], spaced?: boolean): VNode => {
  const itemList: Item[] = items;
  let draggedItemIndex: number | null = null;

  const handleDragStart = (index: number): void => {
    draggedItemIndex = index;
  };

  const handleDrop = async (index: number): Promise<void> => {
    if (draggedItemIndex == null || draggedItemIndex === index) {
      return;
    }

    const updatedItems = [...itemList];
    const [movedItem] = updatedItems.splice(draggedItemIndex, 1);
    updatedItems.splice(index, 0, movedItem);

    const prevResourcePosition = Number(itemList[index - 1]?.Position);
    const nextResourcePosition = Number(itemList[index]?.Position);

    try {
      await fetch(`http://localhost:9999/api/apps/15/resources/hmm/${movedItem.id}/positions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prevResourcePosition: prevResourcePosition ?? undefined,
          nextResourcePosition: nextResourcePosition ?? undefined,
        }),
      });
    } catch {
      // Do nothing
    }

    draggedItemIndex = null;
  };

  return (
    <ul className={spaced ? 'py-4 px-5' : 'pb-4'}>
      {itemList.map((item, index) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <li
          draggable={item.Position != null}
          key={item.id ?? index}
          onDragEnd={() => {
            draggedItemIndex = null;
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragStart={() => handleDragStart(index)}
          onDrop={() => handleDrop(index)}
        >
          <ListItem index={index} item={item} />
        </li>
      ))}
    </ul>
  );
};

bootstrap(
  ({
    data: blockData,
    events,
    parameters: { base, collapsible, groupBy, hideOnNoData = false, title },
    ready,
    utils,
  }) => {
    const [data, setData] = useState<Item[]>([]);
    const [groupedData, setGroupedData] = useState<Record<string, Item[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const renderItemsCallback = useCallback(
      (renderData: Item[], spaced?: boolean) => renderItems(renderData, spaced),
      [],
    );

    useEffect(() => {
      if (blockData != null) {
        const newData = base == null ? blockData : (blockData as any)[base];

        if (Array.isArray(newData)) {
          setData(newData);

          if (!events.on.data) {
            setLoading(false);
          }
        }
      }
    }, [base, blockData, events.on.data]);

    useEffect(() => {
      if (data != null) {
        const newGroupedData: Record<string, Item[]> = {};
        for (const entry of data) {
          const groupName = entry[groupBy];
          if (groupName && typeof groupName === 'string') {
            newGroupedData[groupName] = [...(newGroupedData[groupName] ?? []), entry];
          }
        }
        setGroupedData(newGroupedData);
      }
    }, [data, groupBy]);

    const loadData = useCallback(
      (d: any, err: string): void => {
        if (err) {
          setError(true);
        } else {
          if (base == null) {
            setData(d);
          } else {
            setData(d[base]);
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

    if (hideOnNoData && !data?.length) {
      return null;
    }

    if (error) {
      return (
        <Message className="mt-4 mr-6 mb-4 ml-5" color="danger">
          <span>
            <FormattedMessage id="error" />
          </span>
        </Message>
      );
    }

    if (!data?.length) {
      return (
        <Message className="mt-4 mr-6 mb-4 ml-5">
          <span>
            <FormattedMessage id="noData" />
          </span>
        </Message>
      );
    }

    const renderFirstList = (): VNode => (
      <CollapsibleListComponent
        index={0}
        items={data}
        title={utils.remap(title, blockData) as string}
      />
    );

    return groupBy ? (
      collapsible ? (
        <div>
          {Object.entries(groupedData).length
            ? Object.entries(groupedData).map(([key, value], index) => (
                <CollapsibleListComponent index={index} items={value} key={key} title={key} />
              ))
            : renderFirstList()}
        </div>
      ) : (
        <div>
          {Object.entries(groupedData).length ? (
            Object.entries(groupedData).map(([key, value]) => (
              <div key={key}>
                <div className={styles.title}>{key}</div>
                {renderItemsCallback(value)}
              </div>
            ))
          ) : (
            <>
              <div className={styles.title}>{title}</div>
              {renderItemsCallback(data)}
            </>
          )}
        </div>
      )
    ) : (
      <>
        {title && !collapsible ? <div className={styles.title}>{title}</div> : null}
        {collapsible ? renderFirstList() : renderItemsCallback(data, true)}
      </>
    );
  },
);
