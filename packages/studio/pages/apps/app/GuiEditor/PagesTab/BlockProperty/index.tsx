import { Button, Loader, useData } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import { type ReactElement, useCallback } from 'react';
import { type JsonObject } from 'type-fest';

import styles from './index.module.css';
import { InputList } from '../../Components/InputList/index.js';
import PropertiesHandler from '../../Components/PropertiesHandler/index.js';

interface BlockPropertyProps {
  changeProperty: (parameters: JsonObject) => void;
  changeType: (blockManifest: BlockManifest) => void;
  deleteBlock: () => void;
  selectedBlockName: string;
}
export function BlockProperty({
  changeProperty,
  changeType,
  deleteBlock,
  selectedBlockName,
}: BlockPropertyProps): ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onTypeChange = useCallback(
    (index: number) => {
      if (!selectedBlockName) {
        return;
      }
      changeType(blocks[index]);
    },
    [blocks, changeType, selectedBlockName],
  );

  const getCurrentBlockManifest = (): BlockManifest => {
    if (loading) {
      return;
    }
    const foundBlock = blocks.find(
      (thisBlock) => thisBlock.name === normalizeBlockName(selectedBlockName),
    );
    if (foundBlock) {
      return foundBlock;
    }
  };

  if (error) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }
  const currentBlock = getCurrentBlockManifest();
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
            value={normalizeBlockName(currentBlock.name)}
          />
          <PropertiesHandler
            onChange={changeProperty}
            parameters={currentBlock.parameters}
            schema={
              blocks.find((thisBlock) => thisBlock.name === normalizeBlockName(currentBlock.name))
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
