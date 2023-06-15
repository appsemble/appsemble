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
}: PagesListProps): ReactElement {
  const [disabledPages, setDisabledPages] = useState<number[]>([]);
  const [dragItem, setDragItem] = useState<number>(-1);
  const [dragPageIndex, setDragPageIndex] = useState<number>(-1);

  const pageNames: string[] = (docRef.current.getIn(['pages']) as YAMLSeq).items.map(
    (page, pageIndex: number) => docRef.current.getIn(['pages', pageIndex, 'name']) as string,
  );

  // A list of the blocks with their parents to construct the hierarchy.
  const blocks: { type: string; parent: number; subParent: number; block: number }[] = (
    docRef.current.getIn(['pages']) as YAMLSeq
  ).items.flatMap((page, pageIndex: number) =>
    (docRef.current.getIn(['pages', pageIndex, 'blocks']) as YAMLSeq).items.map(
      (block, blockIndex) => ({
        type: 'page',
        parent: pageIndex,
        subParent: -1,
        block: blockIndex,
      }),
    ),
  );

  const getBlocks = (pageIndex: number): YAMLMap[] => {
    const blocksList = docRef.current.getIn(['pages', pageIndex, 'blocks']) as YAMLSeq;
    return blocksList.items as YAMLMap[];
  };

  const handleDragStart = (e: DragEvent, blockIndex: number, pageIndex: number): void => {
    setDragItem(blockIndex);
    setDragPageIndex(pageIndex);
  };

  const handleDrop = (e: DragEvent, targetIndex: number, targetPageIndex: number): void => {
    const doc = docRef.current;
    if (targetPageIndex === dragPageIndex && dragItem !== -1) {
      const blockList = getBlocks(dragPageIndex);
      const draggedBlock = blockList[dragItem];
      blockList.splice(dragItem, 1);
      blockList.splice(targetIndex, 0, draggedBlock);
      changeIn(['pages', targetPageIndex, 'blocks'], doc.createNode(blockList));
    } else if (targetPageIndex !== dragPageIndex && dragItem !== -1) {
      const blockList = getBlocks(dragPageIndex);
      const targetBlockList = getBlocks(targetPageIndex);
      const draggedBlock = blockList[dragItem];
      blockList.splice(dragItem, 1);
      targetBlockList.splice(targetIndex, 0, draggedBlock);
      changeIn(['pages', targetPageIndex, 'blocks'], doc.createNode(targetBlockList));
      changeIn(['pages', dragPageIndex, 'blocks'], doc.createNode(blockList));
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
