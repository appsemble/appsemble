import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import { type DragEvent, type ReactNode, useCallback } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { type Block } from '../../../../../../../types.js';

interface SubPageBlockItemProps {
  readonly block: Block;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly pageIndex: number;
  readonly saveStack: Document<ParsedNode, true>;
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
  handleDragStart,
  handleDrop,
  onChange,
  pageIndex,
  saveStack,
  selectedBlock,
  selectedPage,
  selectedSubParent,
  subBlock,
}: SubPageBlockItemProps): ReactNode {
  const onSelectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  return (
    <Button
      className={classNames(styles.childItem, {
        'is-link':
          selectedBlock === subBlock.block &&
          selectedPage === pageIndex &&
          selectedSubParent === subBlock.subParent,
      })}
      onClick={() => onSelectBlock(subBlock.parent, subBlock.subParent, subBlock.block)}
      onDragOver={(e) => e.preventDefault()}
      onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
      onDrop={(e) => handleDrop(e, subBlock.block, pageIndex, subBlock.subParent)}
    >
      {subBlock.type === 'flow'
        ? saveStack.toJS().pages[subBlock.parent].steps[subBlock.subParent].blocks[subBlock.block]
            .type
        : saveStack.toJS().pages[subBlock.parent].tabs[subBlock.subParent].blocks[subBlock.block]
            .type}
    </Button>
  );
}
