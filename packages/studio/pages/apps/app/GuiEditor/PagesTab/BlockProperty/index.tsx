import { Button, Loader, useData } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import { type ReactElement, useCallback } from 'react';
import { type JsonObject } from 'type-fest';
import { type Document, parse, type ParsedNode, stringify } from 'yaml';

import { InputList } from '../../Components/InputList/index.js';
import PropertiesHandler from '../../Components/PropertiesHandler/index.js';

interface BlockPropertyProps {
  changeProperty: (parameters: JsonObject) => void;
  changeType: (blockManifest: BlockManifest) => void;
  deleteBlock: () => void;
  selectedBlock: Document<ParsedNode>;
}
export function BlockProperty({
  changeProperty,
  changeType,
  deleteBlock,
  selectedBlock,
}: BlockPropertyProps): ReactElement {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');
  const blockName = normalizeBlockName(
    stringify(selectedBlock.getIn(['type']))
      .replace(/["']/g, '')
      .trim(),
  );

  const onTypeChange = useCallback(
    (index: number) => {
      if (!selectedBlock) {
        return;
      }
      changeType(blocks[index]);
    },
    [blocks, changeType, selectedBlock],
  );

  if (error) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      {Boolean(selectedBlock) && (
        <div>
          <Button className="is-danger" component="a" icon="trash" onClick={() => deleteBlock()}>
            Delete Block
          </Button>

          <InputList
            label="Type"
            onChange={onTypeChange}
            options={blocks.map((block) => block.name)}
            value={normalizeBlockName(blockName)}
          />
          <PropertiesHandler
            onChange={changeProperty}
            parameters={parse(stringify(selectedBlock)).parameters}
            schema={blocks.find((thisBlock) => thisBlock.name === blockName).parameters}
          />
        </div>
      )}
    </div>
  );
}

export default BlockProperty;
