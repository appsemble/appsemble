import { Button, Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import { type DragEvent, type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { type Block } from '../../../../../../types.js';

interface PagesItemProps {
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly pageIndex: number;
  readonly disabledPages: number[];
  readonly page: string;
  readonly blocks: Block[];
  readonly onSelectPage: (index: number, subParentIndex: number) => void;
  readonly setDisabledPages: (pageList: number[]) => void;
  readonly handleDragStart?: (
    e: DragEvent,
    subPageIndex: number,
    pageIndex: number,
    dragIndex: number,
  ) => void;
  readonly handleDrop?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
}
export function PageItem({
  blocks,
  disabledPages,
  handleDragStart,
  handleDrop,
  onSelectPage,
  page,
  pageIndex,
  selectedBlock,
  selectedPage,
  setDisabledPages,
}: PagesItemProps): ReactNode {
  const toggleDropdownPages = useCallback(
    (index: number) => {
      if (disabledPages.includes(pageIndex)) {
        setDisabledPages(disabledPages.filter((p) => p !== index));
      } else {
        setDisabledPages([...disabledPages, pageIndex]);
      }
    },
    [disabledPages, pageIndex, setDisabledPages],
  );

  return (
    <Button
      className={classNames(styles.parentTop, {
        'is-link': selectedPage === pageIndex && selectedBlock === -1,
        'is-info': selectedPage === pageIndex && selectedBlock >= 0,
      })}
      draggable={handleDragStart != null}
      onClick={() => onSelectPage(pageIndex, -1)}
      onDragOver={(e) => e.preventDefault()}
      onDragStart={(e) => handleDragStart(e, -1, pageIndex, 1)}
      onDrop={(e) => handleDrop(e, -1, pageIndex)}
    >
      {blocks.some((block: any) => block.parent === pageIndex) ? (
        <Icon
          className="mx-2"
          icon={disabledPages.includes(pageIndex) ? 'chevron-right' : 'chevron-down'}
          onClick={() => toggleDropdownPages(pageIndex)}
        />
      ) : (
        <Icon className="mx-2" icon="minus" />
      )}
      {page}
    </Button>
  );
}
