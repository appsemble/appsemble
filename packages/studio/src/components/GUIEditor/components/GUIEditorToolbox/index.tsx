import { Button } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import React from 'react';

import { GuiEditorStep } from '../..';
import GUIEditorToolboxBlock from '../GUIEditorToolboxBlock';
import styles from './index.css';

interface GUIEditorToolboxProps {
  setEditorStep: (step: GuiEditorStep) => void;
  setSelectedBlock: (block: BlockManifest) => void;
  blocks: BlockManifest[];
  selectedBlock: BlockManifest;
}

export default function GUIEditorToolbox({
  blocks,
  selectedBlock,
  setEditorStep,
  setSelectedBlock,
}: GUIEditorToolboxProps): React.ReactElement {
  return (
    <div className={styles.flexContainer}>
      <h1 className="title">Add block</h1>
      <div className={styles.maxHeight}>
        <GUIEditorToolboxBlock
          blocks={blocks}
          selectBlock={(block: BlockManifest) => setSelectedBlock(block)}
        />
      </div>
      {selectedBlock !== undefined ? (
        <div className={styles.marginBottom}>
          <h1 className="subtitle" style={{ textTransform: 'capitalize' }}>
            <strong>{stripBlockName(selectedBlock.name)}</strong>
          </h1>
          {selectedBlock.description}
          <a
            href={`https://appsemble.dev/blocks/${selectedBlock.name.split('/')[1]}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {' '}
            More info
          </a>
        </div>
      ) : (
        ''
      )}
      <div className={styles.footer}>
        <Button
          className="button is-warning"
          icon="angle-left"
          onClick={() => {
            setEditorStep(GuiEditorStep.SELECT);
          }}
          style={{ alignContent: 'flex-start' }}
        >
          Back
        </Button>

        <Button
          className="button is-success"
          disabled={!selectedBlock}
          icon="angle-right"
          onClick={() => {
            setEditorStep(GuiEditorStep.EDIT);
          }}
          style={{ alignContent: 'flex-end' }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
