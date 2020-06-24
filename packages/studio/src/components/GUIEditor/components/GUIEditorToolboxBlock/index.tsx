import { Icon, Input } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { NamedEvent } from '../../../../types';
import styles from './index.css';
import messages from './messages';

interface GUIEditorToolboxBlockProps {
  blocks: BlockManifest[];
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, block: BlockManifest) => void;
  value: BlockManifest;
}

export default function GUIEditorToolboxBlock({
  blocks,
  name,
  onChange,
  value,
}: GUIEditorToolboxBlockProps): React.ReactElement {
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [filterBlocks, setFilterBlocks] = React.useState<BlockManifest[]>(blocks);

  const intl = useIntl();

  const onChangeSearch = React.useCallback(
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
      {filterBlocks.map((block) => (
        <label
          key={block.name}
          className={classNames('card', styles.blockFrame, {
            [styles.selected]: value === block,
          })}
        >
          <div className="card-content">
            <Icon icon="box" size="medium" />
            <span className="subtitle">{stripBlockName(block.name)}</span>
            <input
              checked={value ? value.name === block.name : false}
              hidden
              name="type"
              onChange={(event) => onChange(event, block)}
              type="radio"
              value={name}
            />
          </div>
        </label>
      ))}
    </div>
  );
}
