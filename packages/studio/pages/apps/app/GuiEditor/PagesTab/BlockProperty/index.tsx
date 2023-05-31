import { Button, Loader, useData } from '@appsemble/react-components';
import { type BasicPageDefinition, type BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import { type ReactElement, useCallback } from 'react';
import { type JsonObject } from 'type-fest';

import styles from './index.module.css';
import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import PropertiesHandler from '../../Components/PropertiesHandler/index.js';

interface BlockPropertyProps {
  changeProperty: (parameters: JsonObject) => void;
  changeType: (blockManifest: BlockManifest) => void;
  deleteBlock: () => void;
  selectedBlock: number;
  selectedPage: number;
}
export function BlockProperty({
  changeProperty,
  changeType,
  deleteBlock,
  selectedBlock,
  selectedPage,
}: BlockPropertyProps): ReactElement {
  const { app } = useApp();
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onTypeChange = useCallback(
    (index: number) => {
      if (selectedBlock === -1) {
        return;
      }
      changeType(blocks[index]);
    },
    [blocks, changeType, selectedBlock],
  );

  const currentBlock = (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
    selectedBlock
  ];

  if (error) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      {Boolean(currentBlock) && (
        <div>
          <Button
            className={`is-danger ${styles.deleteButton}`}
            component="a"
            icon="trash"
            onClick={() => deleteBlock()}
          >
            Delete Block
          </Button>

          <InputList
            label="Type"
            onChange={onTypeChange}
            options={blocks.map((block) => block.name)}
            value={normalizeBlockName(currentBlock.type)}
          />
          <PropertiesHandler
            onChange={changeProperty}
            parameters={currentBlock.parameters}
            schema={
              blocks.find((thisBlock) => thisBlock.name === normalizeBlockName(currentBlock.type))
                .parameters
            }
          />
          <Button className="is-primary" component="a" icon="add">
            Save Block
          </Button>
        </div>
      )}
    </div>
  );
}

export default BlockProperty;
