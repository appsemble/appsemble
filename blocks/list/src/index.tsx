import { bootstrap, FormattedMessage, useBlock } from '@appsemble/preact';
import { Icon, Loader, Message } from '@appsemble/preact-components';
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
    parameters: { appendData, base, collapsible, groupBy, hideOnNoData = false, title },
    ready,
    utils,
  }) => {
    const [data, setData] = useState<Item[]>([]);
    const [groupedData, setGroupedData] = useState<Record<string, Item[]>>({});
    const [leftoverData, setLeftoverData] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [currentLine, setCurrentLine] = useState(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const {
      actions: { onDrop },
    } = useBlock();

    const renderItems = useCallback(
      (items: Item[], spaced?: boolean): VNode => {
        const itemList: Item[] = items;

        const handleDragStart = (index: number): void => {
          setIsDragging(true);
          setDraggedItemIndex(index);
        };

        const handleDrop = async (index: number): Promise<void> => {
          setIsDragging(false);
          if (draggedItemIndex == null || draggedItemIndex === index) {
            return;
          }

          const updatedItems = [...itemList];
          const [movedItem] = updatedItems.splice(draggedItemIndex, 1);
          updatedItems.splice(index, 0, movedItem);

          const prevResourcePosition = Number(itemList[index]?.Position);
          const nextResourcePosition = Number(itemList[index + 1]?.Position);

          await onDrop({
            prevResourcePosition,
            nextResourcePosition,
            ...movedItem,
          });

          setDraggedItemIndex(null);
        };

        return (
          <ul className={spaced ? 'py-4 px-5' : 'pb-4'}>
            {onDrop.type !== 'noop' && (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <div className={styles.dividerContainer} onDragEnter={() => setCurrentLine(-1)}>
                <div
                  className={`${styles.divider} ${currentLine === -1 ? styles.dividerDragEnter : ''}`}
                />
              </div>
            )}
            {itemList.map((item, index) => (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
              <li
                draggable={isDragging && onDrop ? onDrop.type !== 'noop' : null}
                key={item.id ?? index}
                onDragEnd={() => {
                  handleDrop(currentLine);
                  setCurrentLine(null);
                }}
                onDragEnter={() =>
                  setCurrentLine((prev: number | null) => (prev === index ? prev : index))
                }
                onDragOver={(e) => e.preventDefault()}
                onDragStart={() => handleDragStart(index)}
              >
                <div className="is-flex is-align-items-center">
                  {}
                  {onDrop.type === 'noop' ? null : (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    <div
                      className={String(styles.isMovable)}
                      onMouseEnter={() => setIsDragging(true)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <Icon icon="grip-vertical" size="medium" />
                    </div>
                  )}
                  <div
                    className={`${isDragging && currentLine === index ? styles.listItemDragEnter : ''} ${styles.listItem}`}
                  >
                    <ListItem index={index} item={item} />
                  </div>
                </div>
                {onDrop.type !== 'noop' && (
                  <div className={styles.dividerContainer}>
                    <div
                      className={`${styles.divider} ${index === currentLine ? styles.dividerDragEnter : ''}`}
                    />
                  </div>
                )}
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
      [currentLine, isDragging, onDrop, draggedItemIndex],
    );

    useEffect(() => {
      if (blockData != null) {
        const newData = base == null ? blockData : (blockData as any)[base];

        if (Array.isArray(newData)) {
          if (appendData) {
            setData((prevData) => [...prevData, ...newData]);
          } else {
            setData(newData);
          }

          if (!events.on.data) {
            setLoading(false);
          }
        }
      }
    }, [appendData, base, blockData, events.on.data]);

    useEffect(ready, [ready]);

    useEffect(() => {
      if (data != null) {
        const newGroupedData: Record<string, Item[]> = {};
        const newLeftoverData: Item[] = [];
        for (const entry of data) {
          const groupName = entry[groupBy];
          if (groupName && typeof groupName === 'string') {
            newGroupedData[groupName] = [...(newGroupedData[groupName] ?? []), entry];
          } else {
            newLeftoverData.push(entry);
          }
        }
        setGroupedData(newGroupedData);
        setLeftoverData(newLeftoverData);
      }
    }, [data, groupBy]);

    const loadData = useCallback(
      (d: any, err: string): void => {
        if (err) {
          setError(true);
        } else {
          if (base == null) {
            setData((prevData) => (appendData ? [...prevData, ...d] : d));
          } else {
            setData((prevData) => (appendData ? [...prevData, ...d] : d)[base]);
          }
          setError(false);
        }
        setLoading(false);
      },
      [appendData, base],
    );

    useEffect(() => {
      events.on.data(loadData);
      return () => events.off.data(loadData);
    }, [events, loadData, ready, utils]);

    useEffect(() => {
      const callback = (): void => setData([]);
      events.on.reset(callback);
      return () => events.off.data(callback);
    }, [events]);

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
          {leftoverData.length ? renderItems(leftoverData) : null}
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
            <>
              {leftoverData.length ? renderItems(leftoverData) : null}
              {Object.entries(groupedData).map(([key, value]) => (
                <div key={key}>
                  <div className={styles.title}>{key}</div>
                  {renderItems(value)}
                </div>
              ))}
            </>
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
        {collapsible ? renderFirstList() : renderItems(data, true)}
      </>
    );
  },
);
