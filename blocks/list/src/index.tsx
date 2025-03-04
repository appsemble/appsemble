import { bootstrap, FormattedMessage, useBlock } from '@appsemble/preact';
import { Loader, Message } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { CollapsibleListComponent } from './components/CollapsibleList/index.js';
import { ListItem } from './components/ListItem/index.js';
import styles from './index.module.css';
import { type Item } from '../block.js';

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
    const {
      actions: { onDrop },
    } = useBlock();

    const renderItems = useCallback(
      (items: Item[], spaced?: boolean): VNode => {
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

          const result: Item[] = await onDrop({
            prevResourcePosition,
            nextResourcePosition,
            ...movedItem,
          });

          setData(result);
          draggedItemIndex = null;
        };

        return (
          <ul className={spaced ? 'py-4 px-5' : 'pb-4'}>
            {itemList.map((item, index) => (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
              <li
                draggable={onDrop ? onDrop.type !== 'noop' : null}
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
            {onDrop?.type === 'noop' ? null : (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
              <li
                className={styles.invisible}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(itemList.length)}
              >
                <ListItem index={itemList.length} item={{ Position: null }} preventClick />
              </li>
            )}
          </ul>
        );
      },
      [onDrop, setData],
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
        renderItems={renderItems}
        title={utils.remap(title, blockData) as string}
      />
    );

    return groupBy ? (
      collapsible ? (
        <div>
          {Object.entries(groupedData).length
            ? Object.entries(groupedData).map(([key, value], index) => (
                <CollapsibleListComponent
                  index={index}
                  items={value}
                  key={key}
                  renderItems={renderItems}
                  title={key}
                />
              ))
            : renderFirstList()}
        </div>
      ) : (
        <div>
          {Object.entries(groupedData).length ? (
            Object.entries(groupedData).map(([key, value]) => (
              <div key={key}>
                <div className={styles.title}>{key}</div>
                {renderItems(value)}
              </div>
            ))
          ) : (
            <>
              <div className={styles.title}>{title}</div>
              {renderItems(data)}
            </>
          )}
        </div>
      )
    ) : (
      <>
        {title && !collapsible ? <div className={styles.title}>{title}</div> : null}
        {collapsible ? renderFirstList() : renderItems(data)}
      </>
    );
  },
);
