import { Button, Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import {
  type DragEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useState,
} from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { SubPageBlockItem } from './SubPageBlockItem/index.js';
import { type Block } from '../../../../../../types.js';

interface SubPageItemProps {
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly selectedSubParent: number;
  readonly pageIndex: number;
  readonly blocks: Block[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly handleDragStart?: (e: DragEvent, subPageIndex: number, pageIndex: number) => void;
  readonly onSelectSubPage?: (index: number, subParentIndex: number) => void;
  readonly handleDrop?: (
    e: DragEvent,
    subPageIndex: number,
    pageIndex: number,
    targetSubPageIndex?: number,
  ) => void;
}
export function SubPageItem({
  blocks,
  docRef,
  handleDragStart,
  handleDrop,
  onChange,
  onSelectSubPage,
  pageIndex,
  selectedBlock,
  selectedPage,
  selectedSubParent,
}: SubPageItemProps): ReactElement {
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
              className={classNames(styles.subParent, {
                'is-link':
                  block.subParent === selectedSubParent &&
                  selectedPage === pageIndex &&
                  selectedBlock === -1,
                'is-info':
                  selectedPage === pageIndex &&
                  block.subParent === selectedSubParent &&
                  selectedBlock !== -1,
              })}
              // TODO make sub pages draggable (by adding draggable property)
              key={block.block}
              onClick={() => onSelectSubPage(block.parent, block.subParent)}
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
                    <SubPageBlockItem
                      block={block}
                      docRef={docRef}
                      key={`${subBlock.parent}-${subBlock.subParent}-${subBlock.block}`}
                      onChange={onChange}
                      pageIndex={pageIndex}
                      selectedBlock={selectedBlock}
                      selectedPage={selectedPage}
                      selectedSubParent={selectedSubParent}
                      subBlock={subBlock}
                    />
                  ))}
              </>
            )}
          </div>
        ))}
    </>
  );
}
