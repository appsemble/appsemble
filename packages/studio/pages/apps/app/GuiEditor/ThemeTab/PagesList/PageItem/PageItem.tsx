import { Button, Icon } from '@appsemble/react-components';
import { type ReactElement, useCallback } from 'react';

import styles from './index.module.css';

interface PagesItemProps {
  readonly selectedPage: number;
  readonly selectedBlock: number;
  readonly pageIndex: number;
  readonly disabledPages: number[];
  readonly page: string;
  readonly blocks: { type: string; parent: number; subParent: number; block: number }[];
  readonly onChange: (page: number, subParent: number, block: number) => void;
  readonly setDisabledPages: (pageList: number[]) => void;
}
export function PageItem({
  blocks,
  disabledPages,
  onChange,
  page,
  pageIndex,
  selectedBlock,
  selectedPage,
  setDisabledPages,
}: PagesItemProps): ReactElement {
  const onSelectPage = useCallback(
    (index: number, subParentIndex: number) => {
      onChange(index, subParentIndex, -1);
    },
    [onChange],
  );

  const toggleDropdownPages = useCallback(
    (index: number) => {
      if (disabledPages.includes(pageIndex)) {
        setDisabledPages(disabledPages.filter((p) => p !== index));
      } else {
        setDisabledPages([...disabledPages, pageIndex]);
      }
    },
    [disabledPages, pageIndex, setDisabledPages],
  );

  return (
    <Button
      className={`${styles.parentTop} ${
        selectedPage === pageIndex && selectedBlock === -1
          ? 'is-link'
          : selectedPage === pageIndex && selectedBlock >= 0
          ? 'is-info'
          : ''
      }`}
      onClick={() => onSelectPage(pageIndex, -1)}
    >
      {page}
      {blocks.some((block: any) => block.parent === pageIndex) && (
        <Icon
          className="mx-2"
          icon={disabledPages.includes(pageIndex) ? 'chevron-up' : 'chevron-down'}
          onClick={() => toggleDropdownPages(pageIndex)}
        />
      )}
    </Button>
  );
}
