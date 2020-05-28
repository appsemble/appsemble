import { Icon } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';

import styles from './index.css';

interface GUIEditorToolboxBlockProps {
  blocks: BlockManifest[];
  setSelectedBlock: (block: BlockManifest) => void;
  selectedBlock: BlockManifest;
}
export default function GUIEditorToolboxBlock({
  blocks,
  selectedBlock,
  setSelectedBlock,
}: GUIEditorToolboxBlockProps): React.ReactElement {
  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setSelectedBlock(undefined);
    }
    if (event.key === 'Tab') {
      const nextBlockIndex = blocks.findIndex((x) => x.name === selectedBlock.name) + 1;
      setSelectedBlock(blocks[nextBlockIndex]);
    }
  };

  return (
    <div className={styles.main}>
      {blocks.map((block: BlockManifest) => (
        <div
          key={block.name}
          className={classNames(styles.blockFrame, { [styles.selected]: selectedBlock === block })}
          onClick={() => setSelectedBlock(block)}
          onKeyDown={onKeyDown}
          role="button"
          tabIndex={0}
        >
          {block.iconUrl ? (
            <img alt={stripBlockName(block.name)} src={block.iconUrl} />
          ) : (
            <Icon icon="box" size="large" />
          )}
          <span className={styles.subtext}>{stripBlockName(block.name)}</span>
        </div>
      ))}
    </div>
  );
}
