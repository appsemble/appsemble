import { Icon } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';

import styles from './index.css';

interface GUIEditorToolboxBlockProps {
  blocks: BlockManifest[];
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, block: BlockManifest) => void;
  value: BlockManifest;
}

export default function GUIEditorToolboxBlock({
  blocks,
  name,
  onChange,
  value,
}: GUIEditorToolboxBlockProps): React.ReactElement {
  return (
    <div className={styles.main}>
      {blocks.map((block) => (
        <label
          key={block.name}
          className={classNames(styles.blockFrame, {
            [styles.selected]: value === block,
          })}
        >
          <Icon icon="box" size="large" />
          <span className={styles.subtext}>{stripBlockName(block.name)}</span>
          <input
            checked={value ? value.name === block.name : false}
            hidden
            name="type"
            onChange={(event) => onChange(event, block)}
            type="radio"
            value={name}
          />
        </label>
      ))}
    </div>
  );
}
