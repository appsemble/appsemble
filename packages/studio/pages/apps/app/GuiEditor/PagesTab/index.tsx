<<<<<<< HEAD
<<<<<<< HEAD
import { DragEvent, ReactElement, useCallback, useRef, useState } from 'react';
=======
import { ReactElement, useCallback, useState } from 'react';
>>>>>>> abe0c9bfd (Temporarily removed preview to test drop functionality)
=======
import { ReactElement, useCallback, useRef, useState } from 'react';
>>>>>>> 8d1a6c96b (Add border to preview to detect dragEnter and dragLeave events)

import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import BlockProperty from './BlockProperty/index.js';
import { BlockStore } from './BlockStore/index.js';
import { ElementsList } from './ElementsList/index.js';
import styles from './index.module.css';
import PageProperty from './PageProperty/index.js';

interface PagesTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

export function PagesTab({ isOpenLeft, isOpenRight }: PagesTabProps): ReactElement {
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [selectedPage, setSelectedPage] = useState<number>(-1);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);
  const [editPageView, setEditPageView] = useState<boolean>(false);
  const [editBlockView, setEditBlockView] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<Boolean>(false);
  const [blockManifest, setBlockManifest] = useState<string>('None');
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);

  // Highlight the preview on drag enter
  const handleDragEnter = (): void => {
    setDragOver(true);
  };
  const handleDragExit = (): void => {
    setDragOver(false);
  };
<<<<<<< HEAD
  // Append the dragged block to the app definition
  const handleDrop = (e: DragEvent): void => {
    setBlockManifest(e.dataTransfer.getData('block'));
    setDropzoneActive(false);
=======
  const handleDrop = (e: DragEvent): void => {
    e.preventDefault();
>>>>>>> 8d1a6c96b (Add border to preview to detect dragEnter and dragLeave events)
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

  // On dropping block change dropzone activity to false
  // So it does not cover the app preview
  const onDragEvent = (): void => {
    setDropzoneActive(true);
  };

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

  // The left sidebar will house the hierarchy and the block store
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
<<<<<<< HEAD
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
        >
          {blockManifest}
        </div>
        <Preview app={app} iframeRef={frame} />
=======
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <span
        className={dragOver ? styles.rootDragOver : styles.root}
        onDragEnter={handleDragEnter}
        onDragExit={handleDragExit}
        onDragLeave={handleDragExit}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
<<<<<<< HEAD
        {/* <Preview app={app} iframeRef={frame} /> */}
>>>>>>> abe0c9bfd (Temporarily removed preview to test drop functionality)
      </div>
=======
        <Preview app={app} iframeRef={frame} />
      </span>
>>>>>>> 8d1a6c96b (Add border to preview to detect dragEnter and dragLeave events)
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
