import { normalizeBlockName } from '@appsemble/lang-sdk';
import { Loader, useData } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type MutableRefObject, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLMap, type YAMLSeq } from 'yaml';

import { EditorBlock } from './EditorBlock/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface AppEditorProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly selectedPage: number;
  readonly selectedSubParent: number;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
}

/**
 * Render a page with abstract visualizations of the blocks
 */
export function AppEditor({
  changeIn,
  docRef,
  onChange,
  selectedPage,
  selectedSubParent,
}: AppEditorProps): ReactNode {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');
  const [blockIndex, setBlockIndex] = useState<number>(10_000);
  const [dragIndex, setDragIndex] = useState<number>(0);

  const getBlockPath = useCallback((): unknown[] => {
    const doc = docRef.current;
    if (
      !doc.getIn(['pages', selectedPage, 'type']) ||
      doc.getIn(['pages', selectedPage, 'type']) === 'page'
    ) {
      return ['pages', selectedPage, 'blocks'];
    }
    if (doc.getIn(['pages', selectedPage, 'type']) === 'flow') {
      return ['pages', selectedPage, 'steps', selectedSubParent, 'blocks'];
    }
    if (doc.getIn(['pages', selectedPage, 'type']) === 'tabs') {
      return ['pages', selectedPage, 'tabs', selectedSubParent, 'blocks'];
    }
  }, [docRef, selectedPage, selectedSubParent]);

  const getBlockList = useCallback((): YAMLMap[] => {
    if ((docRef.current.getIn(getBlockPath()) as YAMLSeq) === undefined) {
      return null;
    }
    return (docRef.current.getIn(getBlockPath()) as YAMLSeq).items as YAMLMap[];
  }, [docRef, getBlockPath]);

  const onDragStart = (bIndex: number, dIndex: number): void => {
    setBlockIndex(bIndex);
    setDragIndex(dIndex);
  };
  const onDrop = (dropIndex: number): void => {
    if (dragIndex !== 2) {
      return;
    }
    // Put dropped block at new index
    const doc = docRef.current;
    const blockList = getBlockList();
    const draggedBlock = blockList[blockIndex];
    blockList.splice(blockIndex, 1);
    blockList.splice(dropIndex, 0, draggedBlock);

    changeIn(getBlockPath(), doc.createNode(blockList));

    setBlockIndex(10_000);
  };

  const onSelectBlock = useCallback(
    (bIndex: number, subPageIndex: number) => {
      onChange(selectedPage, subPageIndex, bIndex);
    },
    [onChange, selectedPage],
  );

  if (error) {
    return <FormattedMessage {...messages.error} />;
  }

  if (loading) {
    return <Loader />;
  }

  const appsembleBlocks: BlockManifest[] = blocks
    .filter((b) => b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));
  const thirdPartyBlocks: BlockManifest[] = blocks
    .filter((b) => !b.name.startsWith('@appsemble'))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allBlocks = appsembleBlocks.concat(thirdPartyBlocks);

  return (
    <div className={styles.root}>
      <div className={styles.pageContainer}>
        <b>{docRef.current.getIn(['pages', selectedPage, 'name']) as string}</b>
        <h3>
          Type:
          {docRef.current.getIn(['pages', selectedPage, 'type'])
            ? (docRef.current.getIn(['pages', selectedPage, 'type']) as string)
            : 'Page'}
        </h3>
        <br />
        {getBlockList()
          ? getBlockList().map((block: any, index: number) => (
              <EditorBlock
                block={allBlocks.find(
                  (blockManifest: BlockManifest) =>
                    blockManifest.name.trim() ===
                    normalizeBlockName(block.getIn(['type']) as string),
                )}
                blockIndex={index}
                blockName={block.getIn(['type']) as string}
                // eslint-disable-next-line react/no-array-index-key
                key={`block${index}`}
                onChange={onSelectBlock}
                onDragStart={onDragStart}
                onDrop={onDrop}
                subPageIndex={selectedSubParent}
              />
            ))
          : ''}
      </div>
    </div>
  );
}
