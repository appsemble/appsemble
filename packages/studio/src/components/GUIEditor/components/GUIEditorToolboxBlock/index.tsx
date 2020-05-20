import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';

import type { SelectedBlockManifest } from '../..';
import styles from './index.css';

interface GUIEditorToolboxBlockProps {
  blocks: SelectedBlockManifest[];
  setSelectedBlock: (block: SelectedBlockManifest) => void;
  selectedBlock: SelectedBlockManifest;
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
      {blocks.map((block: SelectedBlockManifest) => (
        <div
          key={block.name}
          className={classNames(styles.blockFrame, { [styles.selected]: selectedBlock === block })}
          onClick={() => setSelectedBlock(block)}
          onKeyDown={onKeyDown}
          role="button"
          tabIndex={0}
        >
          <Icon icon="box" size="large" />
          <span className={styles.subtext}>{block.name.split('/')[1]}</span>
        </div>
      ))}
    </div>
  );
}
