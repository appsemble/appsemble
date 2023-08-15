import { Button } from '@appsemble/react-components';
import { type DragEvent, type MutableRefObject, type ReactElement, useCallback } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';

interface SubPageBlockItemProps {
  readonly block: {
    type: string;
    parent: number;
    subParent: number;
    block: number;
  };
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly pageIndex: number;
  readonly subBlock: {
    type: string;
    parent: number;
    subParent: number;
    block: number;
  };
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly handleDragStart?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
  readonly handleDrop?: (
    e: DragEvent,
    subPageIndex: number,
    pageIndex: number,
    subBlockIndex: number,
  ) => void;
}
export function SubPageBlockItem({
  block,
  docRef,
  handleDragStart,
  handleDrop,
  onChange,
  pageIndex,
  selectedBlock,
  selectedPage,
  selectedSubParent,
  subBlock,
}: SubPageBlockItemProps): ReactElement {
  const onSelectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  return (
    <Button
      className={`${styles.childItem} ${
        selectedBlock === subBlock.block &&
        selectedPage === pageIndex &&
        selectedSubParent === subBlock.subParent
          ? 'is-link'
          : ''
      }`}
      draggable
      onClick={() => onSelectBlock(subBlock.parent, subBlock.subParent, subBlock.block)}
      onDragOver={(e) => e.preventDefault()}
      onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
      onDrop={(e) => handleDrop(e, subBlock.block, pageIndex, subBlock.subParent)}
    >
      {subBlock.type === 'flow'
        ? docRef.current.toJS().pages[subBlock.parent].steps[subBlock.subParent].blocks[
            subBlock.block
          ].type
        : docRef.current.toJS().pages[subBlock.parent].tabs[subBlock.subParent].blocks[
            subBlock.block
          ].type}
    </Button>
  );
}
