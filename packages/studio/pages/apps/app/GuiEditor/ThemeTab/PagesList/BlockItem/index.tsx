import { Button } from '@appsemble/react-components';
import { type App, type BasicPageDefinition } from '@appsemble/types';
import { type ReactElement, useCallback } from 'react';

import styles from './index.module.css';

interface BlockItemProps {
  readonly app: App;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly pageIndex: number;
  readonly blocks: { type: string; parent: number; subParent: number; block: number }[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
}
export function BlockItem({
  app,
  blocks,
  onChange,
  pageIndex,
  selectedBlock,
  selectedPage,
}: BlockItemProps): ReactElement {
  const onselectBlock = useCallback(
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
            key={block.block}
            onClick={() => onselectBlock(block.parent, -1, block.block)}
          >
            {(app.definition.pages[block.parent] as BasicPageDefinition).blocks[block.block].type}
          </Button>
        ))}
    </>
  );
}
