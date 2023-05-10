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
  deleteBlock: (currentBlock: number) => void;
  selectedBlock: number;
  selectedPage: number;
}
export function BlockProperty({
  deleteBlock,
  selectedBlock,
  selectedPage,
}: BlockPropertyProps): ReactElement {
  const { app, setApp } = useApp();
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onChangeProperties = useCallback(
    (parameters: JsonObject) => {
      if (selectedBlock === -1) {
        return;
      }
      (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[selectedBlock].parameters =
        parameters;
      setApp({ ...app });
    },
    [app, selectedBlock, selectedPage, setApp],
  );

  const onTypeChange = useCallback(
    (index: number) => {
      if (selectedBlock === -1) {
        return;
      }
      (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[selectedBlock] = {
        version: blocks[index].version,
        type: blocks[index].name,
      };
      setApp({ ...app });
    },
    [app, blocks, selectedBlock, selectedPage, setApp],
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
            onClick={() => deleteBlock(selectedBlock)}
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
            onChange={onChangeProperties}
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
