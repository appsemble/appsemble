import { type BlockProps, FormattedMessage, useBlock } from '@appsemble/preact';
import { Button, Icon, Loader, Message } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { type Item } from '../block.js';
import { CollapsibleListComponent } from './components/CollapsibleList/index.js';
import { ListItem } from './components/ListItem/index.js';
import styles from './index.module.css';

export function List({
  data: blockData,
  dataTestId,
  events,
  parameters: { appendData, base, collapsible, groupBy, hideOnNoData = false, title },
  ready,
  utils,
}: BlockProps & { readonly dataTestId?: string }): VNode | null {
  const [data, setData] = useState<Item[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupedData, setGroupedData] = useState<Record<string, Item[]>>({});
  const [leftoverData, setLeftoverData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const {
    actions: { onDrop },
    utils: { isMobile },
  } = useBlock();

  useEffect(() => {
    const container: Document | HTMLElement = document;
    let rafId: number | null = null;

    function startScrollUp(): void {
      if (rafId != null) {
        return;
      }
      const step = (): void => {
        window.scrollBy({ top: -8, left: 0, behavior: 'auto' });
        rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }

    function stopScrollUp(): void {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function onDragEnter(e: DragEvent): void {
      const target = e.target as Element | null;
      if (target?.classList?.contains('navbar-brand')) {
        startScrollUp();
      }
    }

    function onDragLeave(e: DragEvent): void {
      const target = e.target as Element | null;
      if (target?.classList?.contains('navbar-brand')) {
        stopScrollUp();
      }
    }

    function onDragEnd(): void {
      stopScrollUp();
    }

    container.addEventListener('dragenter', onDragEnter as EventListener);
    container.addEventListener('dragleave', onDragLeave as EventListener);
    container.addEventListener('dragend', onDragEnd as EventListener);

    return () => {
      stopScrollUp();
      container.removeEventListener('dragenter', onDragEnter as EventListener);
      container.removeEventListener('dragleave', onDragLeave as EventListener);
      container.removeEventListener('dragend', onDragEnd as EventListener);
    };
  }, []);

  const renderItems = useCallback(
    (items: Item[], spaced?: boolean): VNode => {
      const itemList: Item[] = items;

      const handleDragStart = (index: number): void => {
        setIsDragging(true);
        setDraggedItemIndex(index);
      };

      const handleDrop = async (index: number | null): Promise<void> => {
        setIsDragging(false);
        if (draggedItemIndex == null || index == null || draggedItemIndex === index) {
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

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const handleMoveUp = useCallback(
        async (movedItemIndex: number) => {
          const movedItem = itemList.at(movedItemIndex);

          const prevResourcePosition = Number(itemList[movedItemIndex - 2]?.Position);
          const nextResourcePosition = Number(itemList[movedItemIndex - 1]?.Position);

          await onDrop({
            prevResourcePosition,
            nextResourcePosition,
            ...movedItem,
          });
        },
        [itemList],
      );

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const handleMoveDown = useCallback(
        async (movedItemIndex: number) => {
          const movedItem = itemList.at(movedItemIndex);

          const prevResourcePosition = Number(itemList[movedItemIndex + 1]?.Position);
          const nextResourcePosition = Number(itemList[movedItemIndex + 2]?.Position);

          await onDrop({
            prevResourcePosition,
            nextResourcePosition,
            ...movedItem,
          });
        },
        [itemList],
      );

      return isMobile ? (
        <ul className={spaced ? 'py-4' : 'pb-4'}>
          {itemList.map((item, index) => (
            <li key={item.id ?? index}>
              <div className="is-flex is-align-items-center">
                {onDrop.type === 'noop' ? null : (
                  <div className="is-flex is-flex-direction-column mr-4">
                    {index > 0 ? (
                      <Button className="mb-4" onClick={() => handleMoveUp(index)}>
                        <Icon icon="arrow-up" size="medium" />
                      </Button>
                    ) : null}
                    {index < itemList.length - 1 ? (
                      <Button onClick={() => handleMoveDown(index)}>
                        <Icon icon="arrow-down" size="medium" />
                      </Button>
                    ) : null}
                  </div>
                )}
                <div className={styles.listItem}>
                  <ListItem index={index} item={item} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={spaced ? 'py-4' : 'pb-4'}>
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
              draggable={isDragging && onDrop ? onDrop.type !== 'noop' : undefined}
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
              onTouchStart={() => handleDragStart(index)}
            >
              <div className="is-flex is-align-items-center">
                {}
                {onDrop.type === 'noop' ? null : (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    className={styles.isMovable}
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
              <ListItem index={itemList.length} item={{ Position: null }} />
            </li>
          )}
        </ul>
      );
    },
    [isMobile, onDrop, currentLine, draggedItemIndex, isDragging],
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
    if (data != null && groupBy) {
      const newGroupedData: Record<string, Item[]> = groups.length
        ? Object.fromEntries(groups.map((name) => [name, []]))
        : {};
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
  }, [data, groupBy, groups]);

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
    events.on.reset?.(callback);
    return () => events.off.data(callback);
  }, [events]);

  useEffect(() => {
    const callback = (newGroups: any): void => setGroups(newGroups);
    events.on.groups?.(callback);
    return () => events.off.groups?.(callback);
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
      <div className="px-4" data-testid={dataTestId}>
        {leftoverData.length ? renderItems(leftoverData) : null}
        {Object.entries(groupedData).map(([key, value], index) => (
          <CollapsibleListComponent
            index={index}
            items={value}
            key={key}
            renderItems={renderItems}
            title={key}
          />
        ))}
      </div>
    ) : (
      <div className="px-4" data-testid={dataTestId}>
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
          <div className="px-4" data-testid={dataTestId}>
            <div className={styles.title}>{title}</div>
            {renderItems(data)}
          </div>
        )}
      </div>
    )
  ) : (
    <div className="px-4" data-testid={dataTestId}>
      {title && !collapsible ? <div className={styles.title}>{title}</div> : null}
      {collapsible ? renderFirstList() : renderItems(data, true)}
    </div>
  );
}
