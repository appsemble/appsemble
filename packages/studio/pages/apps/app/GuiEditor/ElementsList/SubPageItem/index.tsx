import { Button, Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import { type DragEvent, type ReactNode, useCallback, useState } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { SubPageBlockItem } from './SubPageBlockItem/index.js';
import { type Block, type Page } from '../../../../../../types.js';

interface SubPageItemProps {
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly blocks: Block[];
  readonly saveStack: Document<ParsedNode, true>;
  readonly subPages: Page[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly handleDragStart?: (
    e: DragEvent,
    subPageIndex: number,
    pageIndex: number,
    dragIndex: number,
  ) => void;
  readonly onSelectSubPage?: (index: number, subParentIndex: number) => void;
  readonly handleDrop?: (
    e: DragEvent,
    subPageIndex: number,
    pageIndex: number,
    targetSubPageIndex?: number,
  ) => void;
}
export function SubPageItem({
  blocks,
  handleDragStart,
  handleDrop,
  onChange,
  onSelectSubPage,
  saveStack,
  selectedBlock,
  selectedPage,
  selectedSubParent,
  subPages,
}: SubPageItemProps): ReactNode {
  const [disabledSubParents, setDisabledSubParents] = useState<number[]>([]);

  const toggleDropdownSubParents = useCallback(
    (subParentIndex: number) => {
      if (disabledSubParents.includes(subParentIndex)) {
        setDisabledSubParents(disabledSubParents.filter((p) => p !== subParentIndex));
      } else {
        setDisabledSubParents([...disabledSubParents, subParentIndex]);
      }
    },
    [disabledSubParents],
  );

  if (!subPages) {
    return;
  }
  return (
    <>
      {subPages.map((subPage: Page, subPageIndex: number) => (
        <div key={`subParent-${subPage.name}`}>
          <Button
            className={classNames(styles.subParent, {
              'is-link':
                subPageIndex === selectedSubParent &&
                selectedPage === subPage.index &&
                selectedBlock === -1,
              'is-info':
                selectedPage === subPage.index &&
                subPageIndex === selectedSubParent &&
                selectedBlock !== -1,
            })}
            // TODO make sub pages draggable (by adding draggable property) also fix onDrop target
            key={subPage.index}
            onClick={() => onSelectSubPage(subPage.index, subPageIndex)}
            onDragOver={(e) => e.preventDefault()}
            onDragStart={(e) => handleDragStart(e, subPageIndex, subPage.index, 1)}
            onDrop={(e) => handleDrop(e, subPageIndex, subPage.index, selectedSubParent)}
          >
            {blocks.some(
              (blockItem) =>
                blockItem.parent === subPage.index && blockItem.subParent === subPageIndex,
            ) ? (
              <Icon
                className="mx-2"
                icon={disabledSubParents.includes(subPageIndex) ? 'chevron-right' : 'chevron-down'}
                onClick={() => toggleDropdownSubParents(subPageIndex)}
              />
            ) : (
              <Icon className="mx-2" icon="minus" />
            )}
            {subPage.name}
          </Button>
          {!disabledSubParents.includes(subPageIndex) && (
            <>
              {blocks
                .filter(
                  (subBlock) =>
                    subBlock.parent === subPage.index && subBlock.subParent === subPageIndex,
                )
                .map((subBlock) => (
                  <SubPageBlockItem
                    block={subBlock}
                    handleDrop={handleDrop}
                    key={`${subBlock.parent}-${subBlock.subParent}-${subBlock.block}`}
                    onChange={onChange}
                    pageIndex={subPage.index}
                    saveStack={saveStack}
                    selectedBlock={selectedBlock}
                    selectedPage={selectedPage}
                    selectedSubParent={selectedSubParent}
                    subBlock={subBlock}
                  />
                ))}
            </>
          )}
        </div>
      ))}
    </>
  );
}
