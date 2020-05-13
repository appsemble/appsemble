import { Icon, Loader } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React from 'react';

import styles from './index.css';

interface GUIEditorToolboxBlockProps {
  blocks: BlockManifest[];
  selectBlock: (block: BlockManifest) => void;
}
export default function GUIEditorToolboxBlock({
  blocks,
  selectBlock,
}: GUIEditorToolboxBlockProps): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<BlockManifest>();

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setSelectedBlock(undefined);
    }
  };

  if (blocks === [] || blocks === undefined) {
    return <Loader />;
  }

  return (
    <div className={styles.main}>
      {blocks.map((block: BlockManifest) => (
        <div
          key={block.name}
          className={selectedBlock === block ? styles.blockFrameSelected : styles.blockFrame}
          onClick={() => [setSelectedBlock(block), selectBlock(block)]}
          onKeyDown={() => onKeyDown}
          role="button"
          tabIndex={0}
        >
          <Icon icon="box" size="large" />
          <h2 className={styles.subtext}>{block.name.split('/')[1]}</h2>
        </div>
      ))}
    </div>
  );
}
