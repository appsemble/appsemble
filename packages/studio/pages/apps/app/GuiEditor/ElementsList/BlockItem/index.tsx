import { Button } from '@appsemble/react-components';
import { type DragEvent, type MutableRefObject, type ReactElement, useCallback } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';

interface BlockItemProps {
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly pageIndex: number;
  readonly blocks: { type: string; parent: number; subParent: number; block: number }[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly handleDragStart?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
  readonly handleDrop?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
}
export function BlockItem({
  blocks,
  docRef,
  handleDragStart,
  handleDrop,
  onChange,
  pageIndex,
  selectedBlock,
  selectedPage,
}: BlockItemProps): ReactElement {
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
            {docRef.current.getIn(['pages', block.parent, 'blocks', block.block, 'type']) as string}
          </Button>
        ))}
    </>
  );
}
