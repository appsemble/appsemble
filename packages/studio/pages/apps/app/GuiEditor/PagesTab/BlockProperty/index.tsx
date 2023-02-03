import { Button, Loader, useData } from '@appsemble/react-components';
import { BasicPageDefinition, BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import { ReactElement, useCallback } from 'react';

import { useApp } from '../../../index.js';
import { InputList } from '../../Components/InputList/index.js';
import PropertiesHandler from '../../Components/PropertiesHandler/index.js';

interface BlockPropertyProps {
  selectedBlock: number;
  selectedPage: number;
}
export function BlockProperty({ selectedBlock, selectedPage }: BlockPropertyProps): ReactElement {
  const { app, setApp } = useApp();
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');

  const onChangeProperties = useCallback(
    (parameters) => {
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

  if (error) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }

  const currentBlock = (app.definition.pages[selectedPage] as BasicPageDefinition).blocks[
    selectedBlock
  ];

  return (
    <div>
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
  );
}

export default BlockProperty;
