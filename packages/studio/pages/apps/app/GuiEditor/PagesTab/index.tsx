import {
  type AppDefinition,
  type BasicPageDefinition,
  type BlockDefinition,
  type BlockManifest,
  type FlowPageDefinition,
  type LoopPageDefinition,
  type TabsPageDefinition,
} from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import { type ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { parse } from 'yaml';

import BlockProperty from './BlockProperty/index.js';
import { BlockStore } from './BlockStore/index.js';
import { ElementsList } from './ElementsList/index.js';
import styles from './index.module.css';
import { PageProperty } from './PageProperty/index.js';
import { UndoRedo } from './UndoRedo/index.js';
import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { generateData } from '../Utils/schemaGenerator.js';

interface PagesTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

export function PagesTab({ isOpenLeft, isOpenRight }: PagesTabProps): ReactElement {
  const { app, setApp } = useApp();
  const [saveStack, setSaveStack] = useState([app.yaml]);
  const [index, setIndex] = useState(0);
  const state = useMemo(() => saveStack[index], [saveStack, index]);
  const frame = useRef<HTMLIFrameElement>();
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);
  const [editPageView, setEditPageView] = useState<boolean>(false);
  const [editBlockView, setEditBlockView] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<Boolean>(false);
  const [blockManifest, setBlockManifest] = useState<BlockManifest>(null);
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);

  const onDragEvent = (data: BlockManifest): void => {
    setBlockManifest(data);
    setDropzoneActive(true);
  };
  const handleDragEnter = (): void => {
    setDragOver(true);
  };
  const handleDragExit = (): void => {
    setDragOver(false);
  };

  const getStackSize = (): number => index;

  const setSaveState = (value: string): void => {
    if (state === value) {
      return;
    }

    const copy = saveStack.slice(0, index + 1);
    copy.push(value);
    setSaveStack(copy);
    setIndex(copy.length - 1);
  };

  const onUndo = useCallback(() => {
    setIndex(Math.max(0, index - 1));
    app.definition = parse(state) as AppDefinition;
    setApp({ ...app });
  }, [app, index, setApp, state]);

  const onRedo = useCallback(() => {
    setIndex(Math.min(saveStack.length - 1, index + 1));
    app.definition = parse(state) as AppDefinition;
    setApp({ ...app });
  }, [app, index, saveStack.length, setApp, state]);

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

  const addBlock = (nb: BlockDefinition): void => {
    let pageLength = 0;
    if (
      !app.definition.pages[selectedPage].type ||
      app.definition.pages[selectedPage].type === 'page'
    ) {
      pageLength = (app.definition.pages[selectedPage] as BasicPageDefinition).blocks.push(nb);
    }
    if (app.definition.pages[selectedPage].type === 'flow') {
      pageLength = (app.definition.pages[selectedPage] as FlowPageDefinition).steps
        .flatMap((subPage) => subPage.blocks)
        .push(nb);
    }
    if (app.definition.pages[selectedPage].type === 'loop') {
      pageLength = (app.definition.pages[selectedPage] as LoopPageDefinition).foreach.blocks.push(
        nb,
      );
    }
    if (app.definition.pages[selectedPage].type === 'tabs') {
      pageLength = (app.definition.pages[selectedPage] as TabsPageDefinition).tabs
        .flatMap((subPage) => subPage.blocks)
        .push(nb);
    }
    onChangePagesBlocks(selectedPage, 0, pageLength - 1);
    setApp({ ...app });
    setSaveState(app.yaml);
  };

  const deleteBlock = (): void => {
    const blockList = (app.definition.pages[selectedPage] as BasicPageDefinition).blocks;
    blockList.splice(selectedBlock, 1);
    if (blockList[selectedBlock - 1]) {
      setSelectedBlock(selectedBlock - 1);
    } else if (blockList.length > 0) {
      setSelectedBlock(0);
    } else {
      setSelectedBlock(-1);
    }
    setApp({ ...app });
    setSaveState(app.yaml);
  };

  const handleDrop = (): void => {
    setDropzoneActive(false);
    const newBlock = {
      type: normalizeBlockName(blockManifest.name),
      version: blockManifest.version,
      parameters: generateData(blockManifest.parameters.definitions, blockManifest.parameters),
    } as BlockDefinition;
    addBlock(newBlock);
  };

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <UndoRedo
          getStackSize={getStackSize}
          redoEventListener={onRedo}
          undoEventListener={onUndo}
        />
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
            <BlockProperty
              deleteBlock={deleteBlock}
              selectedBlock={selectedBlock}
              selectedPage={selectedPage}
            />
          ) : null}
        </div>
        <BlockStore dragEventListener={onDragEvent} />
      </Sidebar>
    </>
  );
}
