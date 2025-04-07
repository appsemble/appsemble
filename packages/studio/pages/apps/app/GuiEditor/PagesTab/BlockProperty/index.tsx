import { normalizeBlockName } from '@appsemble/lang-sdk';
import {
  Button,
  Confirmation,
  Loader,
  useConfirmation,
  useData,
} from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type ReactNode, useCallback } from 'react';
import { type JsonObject } from 'type-fest';
import { type Document, parse, type ParsedNode, stringify } from 'yaml';

import styles from './index.module.css';
import { InputList } from '../../Components/InputList/index.js';
import PropertiesHandler from '../../Components/PropertiesHandler/index.js';

interface BlockPropertyProps {
  readonly changeProperty: (parameters: JsonObject) => void;
  readonly changeType: (blockManifest: BlockManifest) => void;
  readonly deleteBlock: () => void;
  readonly selectedBlock: Document<ParsedNode>;
}
export function BlockProperty({
  changeProperty,
  changeType,
  deleteBlock,
  selectedBlock,
}: BlockPropertyProps): ReactNode {
  const { data: blocks, error, loading } = useData<BlockManifest[]>('/api/blocks');
  const blockName = normalizeBlockName(
    stringify(selectedBlock.getIn(['type']))
      .replaceAll(/["']/g, '')
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
  const handleDelete = useConfirmation({
    title: 'Careful!',
    body: 'Do you really want to delete this block?',
    cancelLabel: 'No',
    confirmLabel: 'Yes',
    color: 'danger',
    action: () => deleteBlock(),
  });

  if (error) {
    return null;
  }
  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      <Confirmation>
        {Boolean(selectedBlock) && (
          <div className={styles.propsList}>
            <Button className="is-danger" component="a" icon="trash" onClick={() => handleDelete()}>
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
      </Confirmation>
    </div>
  );
}

export default BlockProperty;
