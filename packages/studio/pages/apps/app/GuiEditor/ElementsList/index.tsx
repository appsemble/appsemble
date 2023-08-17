import { Button, Icon } from '@appsemble/react-components';
import {
  type DragEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLMap, type YAMLSeq } from 'yaml';

import { BlockItem } from './BlockItem/index.js';
import styles from './index.module.css';
import { PageItem } from './PageItem/PageItem.js';
import { SubPageItem } from './SubPageItem/index.js';
import { messages } from '../messages.js';

interface ElementsListProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly onCreatePage: () => void;
}
export function ElementsList({
  changeIn,
  docRef,
  onChange,
  onCreatePage,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: ElementsListProps): ReactElement {
  const [disabledPages, setDisabledPages] = useState<number[]>([]);
  const [dragItem, setDragItem] = useState<number>(-1);
  const [dragPageIndex, setDragPageIndex] = useState<number>(-1);
  const { formatMessage } = useIntl();

  const pageNames: string[] = (docRef.current.getIn(['pages']) as YAMLSeq).items.map(
    (page: YAMLSeq, pageIndex: number) =>
      docRef.current.getIn(['pages', pageIndex, 'name']) as string,
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
      // Cross page block dragging
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
        changeIn(
          ['pages', targetPageIndex, 'steps', targetSubPageIndex, 'blocks'],
          doc.createNode(targetBlockList),
        );
        changeIn(
          ['pages', dragPageIndex, 'steps', selectedSubParent, 'blocks'],
          doc.createNode(blockList),
        );
      } else {
        changeIn(
          ['pages', targetPageIndex, 'tabs', targetSubPageIndex, 'blocks'],
          doc.createNode(targetBlockList),
        );
        changeIn(
          ['pages', dragPageIndex, 'tabs', selectedSubParent, 'blocks'],
          doc.createNode(blockList),
        );
      }
      // Page dragging
    } else if (targetPageIndex !== dragPageIndex && dragItem === -1) {
      const dragPage = doc.getIn(['pages', dragPageIndex]) as YAMLSeq;
      const targetPage = doc.getIn(['pages', targetPageIndex]) as YAMLSeq;
      changeIn(['pages', targetPageIndex], doc.createNode(dragPage));
      changeIn(['pages', dragPageIndex], doc.createNode(targetPage));
    }
    setDragItem(-1);
    setDragPageIndex(-1);
  };

  const onSelectPage = useCallback(
    (pageIndex: number, subParentIndex: number) => {
      onChange(pageIndex, subParentIndex, -1);
    },
    [onChange],
  );

  return (
    <>
      {pageNames.map((page, pageIndex: number) => (
        <div key={page}>
          <PageItem
            blocks={blocks}
            disabledPages={disabledPages}
            handleDragStart={handleDragStart}
            handleDrop={handleDrop}
            onSelectPage={onSelectPage}
            page={page}
            pageIndex={pageIndex}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            setDisabledPages={setDisabledPages}
          />
          {!disabledPages.includes(pageIndex) && (
            <>
              <BlockItem
                blocks={blocks}
                docRef={docRef}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                onChange={onChange}
                pageIndex={pageIndex}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
              />
              <SubPageItem
                blocks={blocks}
                docRef={docRef}
                onChange={onChange}
                onSelectSubPage={onSelectPage}
                pageIndex={pageIndex}
                selectedBlock={selectedBlock}
                selectedPage={selectedPage}
                selectedSubParent={selectedSubParent}
              />
            </>
          )}
        </div>
      ))}
      <Button className={styles.addNewElement} onClick={onCreatePage}>
        {formatMessage(messages.createPage)}
        <Icon className="mx-2" icon="plus" />
      </Button>
    </>
  );
}
