import { Button } from '@appsemble/react-components';
import { type ReactElement, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesList } from './PagesList/index.js';
import { ThemePage } from './ThemePage/index.js';
import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';

interface ThemeTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}
export function ThemeTab({ isOpenLeft, isOpenRight }: ThemeTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [selectedPage, setSelectedPage] = useState<number>(-1);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubParent(subParent);
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubParent],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <>
          <Button
            className={`${styles.sideBarButton} ${
              selectedBlock === -1 && selectedSubParent === -1 && selectedPage === -1
                ? 'is-link'
                : ''
            }`}
            onClick={() => onChangePagesBlocks(-1, -1, -1)}
          >
            {formatMessage(messages.defaultTheme)}
          </Button>
          <PagesList
            onChange={onChangePagesBlocks}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            selectedSubParent={selectedSubParent}
          />
        </>
      </Sidebar>
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          <ThemePage
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            selectedSubParent={selectedSubParent}
          />
        </div>
      </Sidebar>
    </>
  );
}
