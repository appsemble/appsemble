import { Button } from '@appsemble/react-components';
import { type MutableRefObject, type ReactElement, type Ref, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { PagesList } from './PagesList/index.js';
import { ThemePage } from './ThemePage/index.js';
import { AppPreview } from '../../../../../components/AppPreview/index.js';
import { useApp } from '../../index.js';
import { Sidebar } from '../Components/Sidebar/index.js';

interface ThemeTabProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deleteIn: (path: Iterable<unknown>) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly frameRef: Ref<HTMLIFrameElement>;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
}
export function ThemeTab({
  changeIn,
  deleteIn,
  docRef,
  frameRef,
  isOpenLeft,
  isOpenRight,
}: ThemeTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const [selectedPage, setSelectedPage] = useState<number>(-1);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubPage, setSelectedSubPage] = useState<number>(-1);

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubPage(subParent);
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubPage],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <>
          <Button
            className={`${styles.sideBarButton} ${
              selectedBlock === -1 && selectedSubPage === -1 && selectedPage === -1 ? 'is-link' : ''
            }`}
            onClick={() => onChangePagesBlocks(-1, -1, -1)}
          >
            {formatMessage(messages.defaultTheme)}
          </Button>
          <PagesList
            docRef={docRef}
            onChange={onChangePagesBlocks}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            selectedSubParent={selectedSubPage}
          />
        </>
      </Sidebar>
      <div className={styles.root}>
        <AppPreview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          <ThemePage
            changeIn={changeIn}
            deleteIn={deleteIn}
            docRef={docRef}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            selectedSubParent={selectedSubPage}
          />
        </div>
      </Sidebar>
    </>
  );
}
