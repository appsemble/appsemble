import { Button } from '@appsemble/react-components';
import React from 'react';

import { GuiEditorStep } from '../Editor';
import GUIEditorToolboxBlock, { Block } from '../GUIEditorToolboxBlock';
import styles from './index.css';

export default function GUIEditorToolbox(params: any): React.ReactElement {
  const [selectedBlock, setSelectedBlock] = React.useState<Block>();

  return (
    <div className="container">
      <div className={styles.flexContainer}>
        <h1 className="title">Add block</h1>
        <GUIEditorToolboxBlock selectedBlock={(block: Block) => setSelectedBlock(block)} />
        {selectedBlock !== undefined ? (
          <div>
            <h1 className="subtitle" style={{ textTransform: 'capitalize' }}>
              <strong>{selectedBlock.id.split('/')[1]}</strong>
            </h1>
            A simple button that performs an action when clicked. It can be used to trigger actions
            such as redirecting to other pages. By default it displays in the lower-right corner,
            allowing for easy access on mobile devices.
          </div>
        ) : (
          ''
        )}
        <div className={styles.footer}>
          {selectedBlock !== undefined ? (
            <a href={`https://appsemble.dev/blocks/${selectedBlock.id.split('/')[1]}`}>More info</a>
          ) : (
            ''
          )}

          <Button
            className="button is-success"
            disabled={!selectedBlock}
            icon="angle-right"
            onClick={() => {
              params.setEditorStep(GuiEditorStep.EDIT);
              params.setSelectedBlock(selectedBlock);
            }}
            style={{ alignContent: 'flex-end' }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
