import { Button, Icon } from '@appsemble/react-components';
import {
  type DragEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useState,
} from 'react';
import { type Document, type Node, type ParsedNode, type YAMLMap, type YAMLSeq } from 'yaml';

import styles from './index.module.css';

interface PagesListProps {
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  selectedPage: number;
  selectedBlock: number;
  selectedSubParent: number;
  onChange: (page: number, subParent: number, block: number) => void;
  onCreatePage: () => void;
}
export function ElementsList({
  changeIn,
  docRef,
  onChange,
  onCreatePage,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: PagesListProps): ReactElement {
  const [disabledPages, setDisabledPages] = useState<number[]>([]);
  const [disabledSubParents, setDisabledSubParents] = useState<number[]>([]);
  const [dragItem, setDragItem] = useState<number>(-1);
  const [dragPageIndex, setDragPageIndex] = useState<number>(-1);

  const pageNames: string[] = (docRef.current.getIn(['pages']) as YAMLSeq).items.map(
    (page: any, pageIndex: number) => docRef.current.getIn(['pages', pageIndex, 'name']) as string,
  );

  // A list of the blocks with their parents to construct the hierarchy.
  const blocks: { type: string; parent: number; subParent: number; block: number }[] = (
    docRef.current.getIn(['pages']) as YAMLSeq
  ).items.flatMap((page: YAMLMap, pageIndex: number) => {
    if (!page.getIn(['type']) || page.getIn(['type']) === 'page') {
      return (page.getIn(['blocks']) as YAMLSeq).items.map((block: any, blockIndex: number) => ({
        type: 'page',
        parent: pageIndex,
        subParent: -1,
        block: blockIndex,
      }));
    }
    if (page.getIn(['type']) === 'flow') {
      return (page.getIn(['steps']) as YAMLSeq).items.flatMap(
        (subPage: any, subPageIndex: number) =>
          subPage.getIn(['blocks']).items.map((block: any, blockIndex: number) => ({
            type: 'flow',
            parent: pageIndex,
            subParent: subPageIndex,
            block: blockIndex,
          })),
      );
    }
    if (page.getIn(['type']) === 'tabs') {
      return (page.getIn(['tabs']) as YAMLSeq).items.flatMap((subPage: any, subPageIndex: number) =>
        subPage.getIn(['blocks']).items.map((block: any, blockIndex: number) => ({
          type: 'tabs',
          parent: pageIndex,
          subParent: subPageIndex,
          block: blockIndex,
        })),
      );
    }
  });

  const getBlocks = (pageIndex: number): YAMLMap[] => {
    const doc = docRef.current;
    if (
      !doc.getIn(['pages', pageIndex, 'type']) ||
      doc.getIn(['pages', pageIndex, 'type']) === 'page'
    ) {
      const blocksList = doc.getIn(['pages', pageIndex, 'blocks']) as YAMLSeq;
      return blocksList.items as YAMLMap[];
    }
    if (doc.getIn(['pages', pageIndex, 'type']) === 'flow') {
      const blocksList = (doc.getIn(['pages', pageIndex, 'steps']) as YAMLSeq).items.flatMap(
        (subPage: any) => subPage,
      );
      return blocksList as YAMLMap[];
    }
    if (doc.getIn(['pages', pageIndex, 'type']) === 'tabs') {
      const blocksList = (doc.getIn(['pages', pageIndex, 'tabs']) as YAMLSeq).items.flatMap(
        (subPage: any) => subPage,
      );
      return blocksList as YAMLMap[];
    }
  };

  const handleDragStart = (e: DragEvent, blockIndex: number, pageIndex: number): void => {
    setDragItem(blockIndex);
    setDragPageIndex(pageIndex);
  };

  const handleDrop = (
    e: DragEvent,
    targetIndex: number,
    targetPageIndex: number,
    targetSubPageIndex?: number,
  ): void => {
    const doc = docRef.current;
    if (targetPageIndex === dragPageIndex && dragItem !== -1) {
      const blockList = getBlocks(dragPageIndex);
      const draggedBlock = blockList[dragItem];
      blockList.splice(dragItem, 1);
      blockList.splice(targetIndex, 0, draggedBlock);
      if (
        !doc.getIn(['pages', targetPageIndex, 'type']) ||
        doc.getIn(['pages', targetPageIndex, 'type']) === 'page'
      ) {
        changeIn(['pages', targetPageIndex, 'blocks'], doc.createNode(blockList));
      } else if (doc.getIn(['pages', targetPageIndex, 'type']) === 'flow') {
        // TODO: change subParent index (0) to match actual subParent
        changeIn(
          ['pages', targetPageIndex, 'steps', targetSubPageIndex, 'blocks'],
          doc.createNode(blockList),
        );
      } else {
        changeIn(
          ['pages', targetPageIndex, 'tabs', targetSubPageIndex, 'blocks'],
          doc.createNode(blockList),
        );
      }
    } else if (targetPageIndex !== dragPageIndex && dragItem !== -1) {
      const blockList = getBlocks(dragPageIndex);
      const targetBlockList = getBlocks(targetPageIndex);
      const draggedBlock = blockList[dragItem];
      blockList.splice(dragItem, 1);
      targetBlockList.splice(targetIndex, 0, draggedBlock);
      if (
        !doc.getIn(['pages', targetPageIndex, 'type']) ||
        doc.getIn(['pages', targetPageIndex, 'type']) === 'page'
      ) {
        changeIn(['pages', targetPageIndex, 'blocks'], doc.createNode(targetBlockList));
        changeIn(['pages', dragPageIndex, 'blocks'], doc.createNode(blockList));
      } else if (doc.getIn(['pages', targetPageIndex, 'type']) === 'flow') {
        // TODO: change subParent index (0) to match actual subParent
        changeIn(['pages', targetPageIndex, 'steps', 0, 'blocks'], doc.createNode(targetBlockList));
        changeIn(['pages', dragPageIndex, 'steps', 0, 'blocks'], doc.createNode(blockList));
      } else {
        changeIn(['pages', targetPageIndex, 'tabs', 0, 'blocks'], doc.createNode(targetBlockList));
        changeIn(['pages', dragPageIndex, 'tabs', 0, 'blocks'], doc.createNode(blockList));
      }
    } else if (targetPageIndex !== dragPageIndex && dragItem === -1) {
      const dragPage = doc.getIn(['pages', dragPageIndex]) as YAMLSeq;
      const targetPage = doc.getIn(['pages', targetPageIndex]) as YAMLSeq;
      changeIn(['pages', targetPageIndex], doc.createNode(dragPage));
      changeIn(['pages', dragPageIndex], doc.createNode(targetPage));
    }
    setDragItem(-1);
    setDragPageIndex(-1);
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

  const onSelectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  return (
    <>
      {pageNames.map((page, pageIndex) => (
        <div key={page}>
          <Button
            className={`${styles.parentTop} ${
              selectedPage === pageIndex && selectedBlock === -1
                ? 'is-link'
                : selectedPage === pageIndex && selectedBlock >= 0
                ? 'is-info'
                : ''
            }`}
            draggable
            onClick={() => onSelectPage(pageIndex, -1)}
            onDragOver={(e) => e.preventDefault()}
            onDragStart={(e) => handleDragStart(e, -1, pageIndex)}
            onDrop={(e) => handleDrop(e, -1, pageIndex)}
          >
            {page}
            {blocks.some((block) => block.parent === pageIndex) && (
              <Icon
                className="mx-2"
                icon={disabledPages.includes(pageIndex) ? 'chevron-up' : 'chevron-down'}
                onClick={() => toggleDropdownPages(pageIndex)}
              />
            )}
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
                    onClick={() => onSelectBlock(block.parent, -1, block.block)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
                    onDrop={(e) => handleDrop(e, block.block, pageIndex)}
                  >
                    {
                      docRef.current.getIn([
                        'pages',
                        block.parent,
                        'blocks',
                        block.block,
                        'type',
                      ]) as string
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
                      draggable
                      key={block.block}
                      onClick={() => onSelectBlock(block.parent, block.subParent, block.block)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
                      onDrop={(e) => handleDrop(e, block.block, pageIndex, block.subParent)}
                    >
                      {
                        docRef.current.getIn([
                          'pages',
                          block.parent,
                          block.type === 'flow' ? 'steps' : 'tabs',
                          block.subParent,
                          'name',
                        ]) as string
                      }
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
                              draggable
                              key={`${subBlock.parent}-${subBlock.subParent}-${subBlock.block}`}
                              onClick={() =>
                                onSelectBlock(subBlock.parent, subBlock.subParent, subBlock.block)
                              }
                              onDragOver={(e) => e.preventDefault()}
                              onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
                              onDrop={(e) =>
                                handleDrop(e, subBlock.block, pageIndex, subBlock.subParent)
                              }
                            >
                              {subBlock.type === 'flow'
                                ? docRef.current.toJS().pages[subBlock.parent].steps[
                                    subBlock.subParent
                                  ].blocks[subBlock.block].type
                                : docRef.current.toJS().pages[subBlock.parent].tabs[
                                    subBlock.subParent
                                  ].blocks[subBlock.block].type}
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
