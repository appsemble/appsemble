import { Loader, Title } from '@appsemble/react-components';
import { stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { GuiEditorStep, SelectedBlockManifest } from '../..';
import GUIEditorToolboxBlock from '../GUIEditorToolboxBlock';
import Stepper from '../Stepper';
import styles from './index.css';
import messages from './messages';

interface GUIEditorToolboxProps {
  setEditorStep: (step: GuiEditorStep) => void;
  setSelectedBlock: (block: SelectedBlockManifest) => void;
  selectedBlock: SelectedBlockManifest;
}

export default function GUIEditorToolbox({
  selectedBlock,
  setEditorStep,
  setSelectedBlock,
}: GUIEditorToolboxProps): React.ReactElement {
  const [blocks, setBlocks] = React.useState<SelectedBlockManifest[]>(undefined);

  React.useEffect(() => {
    const getBlocks = async (): Promise<void> => {
      const { data } = await axios.get('/api/blocks');
      setBlocks(data);
    };
    getBlocks();
  }, []);

  if (blocks === undefined) {
    return <Loader />;
  }

  return (
    <div className={styles.flexContainer}>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className={styles.maxHeight}>
        <GUIEditorToolboxBlock
          blocks={blocks}
          selectedBlock={selectedBlock}
          setSelectedBlock={setSelectedBlock}
        />
      </div>
      {selectedBlock && (
        <div className={styles.marginBottom}>
          <Title level={4}>{stripBlockName(selectedBlock.name)}</Title>
          {selectedBlock.description}
          <a
            href={`https://appsemble.dev/blocks/${stripBlockName(selectedBlock.name)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.moreInfo} />
          </a>
        </div>
      )}
      <Stepper
        leftOnClick={() => setEditorStep(GuiEditorStep.SELECT)}
        rightDisabled={!selectedBlock}
        rightOnClick={() => {
          setEditorStep(GuiEditorStep.EDIT);
        }}
      />
    </div>
  );
}
