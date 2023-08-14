import { Button, Icon } from '@appsemble/react-components';
import { type App, type FlowPageDefinition, type TabsPageDefinition } from '@appsemble/types';
import { type ReactElement, useCallback, useState } from 'react';

import styles from './index.module.css';

interface SubBlockItemProps {
  readonly app: App;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly pageIndex: number;
  readonly blocks: { type: string; parent: number; subParent: number; block: number }[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
}
export function SubBlockItem({
  app,
  blocks,
  onChange,
  pageIndex,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: SubBlockItemProps): ReactElement {
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

  const onselectBlock = useCallback(
    (parentIndex: number, subParentIndex: number, blockIndex: number) => {
      onChange(parentIndex, subParentIndex, blockIndex);
    },
    [onChange],
  );

  return (
    <>
      {blocks
        .filter(
          (block, index, self) =>
            block.parent === pageIndex &&
            block.subParent !== -1 &&
            self.findIndex((b) => b.subParent === block.subParent && b.parent === block.parent) ===
              index,
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
                ? (app.definition.pages[block.parent] as FlowPageDefinition).steps[block.subParent]
                    .name
                : (app.definition.pages[block.parent] as TabsPageDefinition).tabs[block.subParent]
                    .name}
              {blocks.some(
                (blockItem) =>
                  blockItem.parent === pageIndex && blockItem.subParent === block.subParent,
              ) && (
                <Icon
                  className="mx-2"
                  icon={
                    disabledSubParents.includes(block.subParent) ? 'chevron-up' : 'chevron-down'
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
                      subBlock.parent === pageIndex && subBlock.subParent === block.subParent,
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
                        ? (app.definition.pages[subBlock.parent] as FlowPageDefinition).steps[
                            subBlock.subParent
                          ].blocks[subBlock.block].type
                        : (app.definition.pages[subBlock.parent] as TabsPageDefinition).tabs[
                            subBlock.subParent
                          ].blocks[subBlock.block].type}
                    </Button>
                  ))}
              </>
            )}
          </div>
        ))}
    </>
  );
}
