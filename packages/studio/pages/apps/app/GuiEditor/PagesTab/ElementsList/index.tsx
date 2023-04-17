import { Button, Icon } from '@appsemble/react-components';
import { BasicPageDefinition, FlowPageDefinition, TabsPageDefinition } from '@appsemble/types';
import { DragEvent, MouseEvent, ReactElement, useCallback, useState } from 'react';

import { useApp } from '../../../index.js';
import styles from './index.module.css';

interface PagesListProps {
  selectedPage: number;
  selectedBlock: number;
  selectedSubParent: number;
  onChange: (page: number, subParent: number, block: number) => void;
  onCreateBlock: (pageToAdd: number) => void;
  onCreatePage: () => void;
}
export function ElementsList({
  onChange,
  onCreateBlock,
  onCreatePage,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: PagesListProps): ReactElement {
  const { app } = useApp();
  const [disabledPages, setDisabledPages] = useState<number[]>([]);
  const [disabledSubParents, setDisabledSubParents] = useState<number[]>([]);
  const [dragItem, setDragItem] = useState<number>(-1);
  const [dragPageIndex, setDragPageIndex] = useState<number>(-1);

  const pages: string[] = app.definition.pages.map((page) => page.name);
  const blocks: { type: string; parent: number; subParent: number; block: number }[] =
    app.definition.pages.flatMap((page, pageIndex) => {
      if (!page.type || page.type === 'page') {
        return (page as BasicPageDefinition).blocks.map((block, blockIndex) => ({
          type: 'page',
          parent: pageIndex,
          subParent: -1,
          block: blockIndex,
        }));
      }
      if (page.type === 'flow') {
        return (page as FlowPageDefinition).steps.flatMap((subPage, subPageIndex) =>
          subPage.blocks.map((block, blockIndex) => ({
            type: 'flow',
            parent: pageIndex,
            subParent: subPageIndex,
            block: blockIndex,
          })),
        );
      }
      if (page.type === 'tabs') {
        return (page as TabsPageDefinition).tabs.flatMap((subPage, subPageIndex) =>
          subPage.blocks.map((block, blockIndex) => ({
            type: 'tabs',
            parent: pageIndex,
            subParent: subPageIndex,
            block: blockIndex,
          })),
        );
      }
    });

  const handleDragStart = (e: DragEvent, blockIndex: number, pageIndex: number): void => {
    setDragItem(blockIndex);
    setDragPageIndex(pageIndex);
  };

  const handleDrop = (e: DragEvent, blockIndex: number, pageIndex: number): void => {
    if (pageIndex === dragPageIndex && dragItem !== -1) {
      const blockList = app.definition.pages[pageIndex].blocks;
      const draggedBlock = blockList[dragItem];
      blockList.splice(dragItem, 1);
      blockList.splice(blockIndex, 0, draggedBlock);
    }
  };

  const toggleDropdownPages = useCallback(
    (pageIndex: number) => {
      if (disabledPages.includes(pageIndex)) {
        setDisabledPages(disabledPages.filter((p) => p !== pageIndex));
      } else {
        setDisabledPages([...disabledPages, pageIndex]);
      }
    },
    [disabledPages],
  );

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

  const onSelectPage = useCallback(
    (pageIndex: number, subParentIndex: number) => {
      onChange(pageIndex, subParentIndex, -1);
    },
    [onChange],
  );

  const onselectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  const onAddBlock = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onCreateBlock(selectedPage);
    },
    [onCreateBlock, selectedPage],
  );

  return (
    <>
      {pages.map((page, pageIndex) => (
        <div key={page}>
          <Button
            className={`${styles.parentTop} ${
              selectedPage === pageIndex && selectedBlock === -1
                ? 'is-link'
                : selectedPage === pageIndex && selectedBlock >= 0
                ? 'is-info'
                : ''
            }`}
            onClick={() => onSelectPage(pageIndex, -1)}
          >
            {page}
            {blocks.some((block) => block.parent === pageIndex) && (
              <Icon
                className="mx-2"
                icon={disabledPages.includes(pageIndex) ? 'chevron-up' : 'chevron-down'}
                onClick={() => toggleDropdownPages(pageIndex)}
              />
            )}
            <Icon className="has-text-grey" icon="plus" onClick={onAddBlock} />
          </Button>
          {!disabledPages.includes(pageIndex) && (
            <>
              {blocks
                .filter((block) => block.parent === pageIndex && block.subParent === -1)
                .map((block) => (
                  <Button
                    className={`${styles.childItem} ${
                      selectedBlock === block.block && selectedPage === pageIndex ? 'is-link' : ''
                    }`}
                    draggable
                    key={block.block}
                    onClick={() => onselectBlock(block.parent, -1, block.block)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
                    onDrop={(e) => handleDrop(e, block.block, pageIndex)}
                  >
                    {
                      (app.definition.pages[block.parent] as BasicPageDefinition).blocks[
                        block.block
                      ].type
                    }
                  </Button>
                ))}
              {blocks
                .filter(
                  (block, index, self) =>
                    block.parent === pageIndex &&
                    block.subParent !== -1 &&
                    self.findIndex(
                      (b) => b.subParent === block.subParent && b.parent === block.parent,
                    ) === index,
                )
                .map((block) => (
                  <div key={`subParent-${block.subParent}`}>
                    <Button
                      className={`${styles.subParent} ${
                        block.subParent === selectedSubParent &&
                        selectedPage === pageIndex &&
                        selectedBlock !== -1
                          ? 'is-info'
                          : ''
                      }`}
                    >
                      {block.type === 'flow'
                        ? (app.definition.pages[block.parent] as FlowPageDefinition).steps[
                            block.subParent
                          ].name
                        : (app.definition.pages[block.parent] as TabsPageDefinition).tabs[
                            block.subParent
                          ].name}
                      {blocks.some(
                        (blockItem) =>
                          blockItem.parent === pageIndex && blockItem.subParent === block.subParent,
                      ) && (
                        <Icon
                          className="mx-2"
                          icon={
                            disabledSubParents.includes(block.subParent)
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          onClick={() => toggleDropdownSubParents(block.subParent)}
                        />
                      )}
                    </Button>
                    {!disabledSubParents.includes(block.subParent) && (
                      <>
                        {blocks
                          .filter(
                            (subBlock) =>
                              subBlock.parent === pageIndex &&
                              subBlock.subParent === block.subParent,
                          )
                          .map((subBlock) => (
                            <Button
                              className={`${styles.childItem} ${
                                selectedBlock === subBlock.block &&
                                selectedPage === pageIndex &&
                                selectedSubParent === subBlock.subParent
                                  ? 'is-link'
                                  : ''
                              }`}
                              key={`${subBlock.parent}-${subBlock.subParent}-${subBlock.block}`}
                              onClick={() =>
                                onselectBlock(subBlock.parent, subBlock.subParent, subBlock.block)
                              }
                            >
                              {subBlock.type === 'flow'
                                ? (app.definition.pages[subBlock.parent] as FlowPageDefinition)
                                    .steps[subBlock.subParent].blocks[subBlock.block].type
                                : (app.definition.pages[subBlock.parent] as TabsPageDefinition)
                                    .tabs[subBlock.subParent].blocks[subBlock.block].type}
                            </Button>
                          ))}
                      </>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>
      ))}
      <Button className={styles.addNewElement} onClick={onCreatePage}>
        Add Page
        <Icon className="mx-2" icon="plus" />
      </Button>
    </>
  );
}
