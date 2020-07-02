import { Input, ValuePickerProvider } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { NamedEvent } from '../../../../types';
import GUIEditorBlockItem from '../GUIEditorBlockItem';
import messages from './messages';

interface GUIEditorToolboxBlockProps {
  blocks: BlockManifest[];
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>, block: BlockManifest) => void;
  value: BlockManifest;
}

export default function GUIEditorToolboxBlock({
  blocks,
  name,
  onChange,
  value,
}: GUIEditorToolboxBlockProps): ReactElement {
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterBlocks, setFilterBlocks] = useState<BlockManifest[]>(blocks);

  const intl = useIntl();

  const onChangeSearch = useCallback(
    (_event: NamedEvent, query: string) => {
      setSearchValue(query);
      const updatedList = blocks.filter(
        (item) => item.name.toLowerCase().search(query.toLowerCase()) !== -1,
      );

      setFilterBlocks(updatedList);
    },
    [setFilterBlocks, setSearchValue, blocks],
  );

  return (
    <div>
      <Input
        label={<FormattedMessage {...messages.search} />}
        name="search"
        onChange={onChangeSearch}
        placeholder={intl.formatMessage(messages.enterBlockName)}
        required
        value={searchValue}
      />
      <ValuePickerProvider name={name} onChange={onChange} value={value}>
        {filterBlocks.map((block) => (
          <GUIEditorBlockItem value={block} />
        ))}
      </ValuePickerProvider>
    </div>
  );
}
