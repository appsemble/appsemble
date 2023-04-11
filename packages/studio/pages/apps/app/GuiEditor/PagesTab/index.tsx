import { Message } from '@appsemble/react-components';
import { BlockDefinition, BlockManifest } from '@appsemble/types';
import { ReactElement, useCallback, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { generateData } from '../Utils/schemaGenerator.js';
import BlockProperty from './BlockProperty/index.js';
import { BlockStore } from './BlockStore/index.js';
import { ElementsList } from './ElementsList/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { PageProperty } from './PageProperty/index.js';

interface PagesTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

export function PagesTab({ isOpenLeft, isOpenRight }: PagesTabProps): ReactElement {
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);
  const [editPageView, setEditPageView] = useState<boolean>(false);
  const [editBlockView, setEditBlockView] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<Boolean>(false);
  const [blockData, setBlockData] = useState<BlockManifest>(null);
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);
  let error = false;

  const onDragEvent = (data: BlockManifest): void => {
    setBlockData(data);
    setDropzoneActive(true);
  };
  const handleDragEnter = (): void => {
    setDragOver(true);
  };
  const handleDragExit = (): void => {
    setDragOver(false);
  };

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubParent(subParent);
      if (block !== -1) {
        setEditPageView(false);
        setEditBlockView(true);
        return;
      }
      if (page !== -1 && block === -1) {
        setEditPageView(true);
        setEditBlockView(false);
      }
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubParent],
  );

  const onCreatePage = useCallback(() => {
    setEditPageView(true);
    setEditBlockView(false);
    setSelectedPage(-1);
  }, [setEditPageView, setEditBlockView]);

  const onCreateBlock = useCallback(
    (pageToAdd: number) => {
      setEditPageView(false);
      setEditBlockView(true);
      setSelectedPage(pageToAdd);
    },
    [setEditPageView, setEditBlockView, setSelectedPage],
  );

  const createBlockDefinition = (bm: BlockManifest): BlockDefinition =>
    ({
      type: bm.name,
      version: bm.version,
      parameters: generateData(bm, bm.parameters.definitions),
    } as BlockDefinition);

  const handleDrop = (): void => {
    setDropzoneActive(false);
    if (blockData && app.definition.pages[selectedPage].type !== 'flow') {
      const newBlock = createBlockDefinition(blockData);
      app.definition.pages[selectedPage].blocks.push(newBlock);
      onChangePagesBlocks(selectedPage, 0, app.definition.pages[0].blocks.length - 1);
    } else {
      error = true;
    }
  };

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <ElementsList
          onChange={onChangePagesBlocks}
          onCreateBlock={onCreateBlock}
          onCreatePage={onCreatePage}
          selectedBlock={selectedBlock}
          selectedPage={selectedPage}
          selectedSubParent={selectedSubParent}
        />
      </Sidebar>
      <div className={styles.root}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={`${dropzoneActive ? styles.dropzoneActive : styles.dropzoneInactive}  ${
            dragOver ? styles.dropzoneDragOver : styles.dropzone
          } is-flex m-0 p-0`}
          draggable={false}
          onDragEnter={handleDragEnter}
          onDragExit={handleDragExit}
          onDragLeave={handleDragExit}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        />
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          {editPageView ? <PageProperty selectedPage={selectedPage} /> : null}
          {editBlockView ? (
            <BlockProperty selectedBlock={selectedBlock} selectedPage={selectedPage} />
          ) : null}
        </div>
        <BlockStore dragEventListener={onDragEvent} />
      </Sidebar>
    </>
  );
}
