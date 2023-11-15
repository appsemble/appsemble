import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import { type DragEvent, type ReactNode, useCallback } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { type Block } from '../../../../../../types.js';

interface BlockItemProps {
  readonly saveStack: Document<ParsedNode, true>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly pageIndex: number;
  readonly blocks: Block[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly handleDragStart?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
  readonly handleDrop?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
}
export function BlockItem({
  blocks,
  handleDragStart,
  handleDrop,
  onChange,
  pageIndex,
  saveStack,
  selectedBlock,
  selectedPage,
}: BlockItemProps): ReactNode {
  const onSelectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  return (
    <>
      {blocks
        .filter((block) => block.parent === pageIndex && block.subParent === -1)
        .map((block) => (
          <Button
            className={classNames(styles.childItem, {
              'is-link': selectedBlock === block.block && selectedPage === pageIndex,
            })}
            draggable={handleDragStart != null}
            key={block.block}
            onClick={() => onSelectBlock(block.parent, -1, block.block)}
            onDragOver={(e) => e.preventDefault()}
            onDragStart={(e) => handleDragStart(e, block.block, pageIndex)}
            onDrop={(e) => handleDrop(e, block.block, pageIndex)}
          >
            {saveStack.getIn(['pages', block.parent, 'blocks', block.block, 'type']) as string}
          </Button>
        ))}
    </>
  );
}
