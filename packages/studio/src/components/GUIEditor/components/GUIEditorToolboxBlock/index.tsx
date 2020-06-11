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
  const onChange = React.useCallback(
    (_event: React.ChangeEvent, block: BlockManifest): void => {
      setSelectedBlock(block);
    },
    [setSelectedBlock],
  );

  return (
    <div className={styles.main}>
      {blocks.map(
        (block: BlockManifest): React.ReactElement => (
          <label
            key={block.name}
            className={classNames(styles.blockFrame, {
              [styles.selected]: selectedBlock === block,
            })}
          >
            <Icon icon="box" size="large" />
            <span className={styles.subtext}>{stripBlockName(block.name)}</span>
            <input
              checked={selectedBlock ? selectedBlock.name === block.name : false}
              hidden
              name={block.name}
              onChange={(event) => onChange(event, block)}
              type="radio"
              value={block.name}
            />
          </label>
        ),
      )}
    </div>
  );
}
