import { InputField, Title } from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import { BlockList } from './BlockList/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

/**
 * The Block Store houses all available blocks as a list of thumbnails.
 * Each block is shown as a thumbnail with the block name, icon and version in it.
 *
 * @returns A list of available blocks that can be dragged and dropped into the app preview.
 */

interface BlockStoreProps {
  readonly dragEventListener: (data: BlockManifest) => void;
}

export function BlockStore({ dragEventListener }: BlockStoreProps): ReactNode {
  const [filter, setFilter] = useState('');
  const { formatMessage } = useIntl();

  const onFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.currentTarget.value);
  }, []);

  return (
    <div className={styles.blockStore}>
      <div className={styles.blockStoreHeader}>
        <header className="px-2 py-2 is-flex">
          <div className={styles.title}>
            <Title
              className={`${styles.ellipsis} ${styles.title}`}
              lang={defaultLocale}
              level={5}
              size={4}
            >
              Block Store
            </Title>
          </div>
        </header>
      </div>
      <div className={styles.blockStoreSearch}>
        <InputField
          className={String(styles.searchField)}
          icon="search"
          name="search"
          onChange={onFilterChange}
          placeholder={formatMessage(messages.search)}
          type="search"
        />
      </div>
      <div className={styles.blocksList}>
        <BlockList dragEventListener={dragEventListener} filter={filter} />
      </div>
    </div>
  );
}
