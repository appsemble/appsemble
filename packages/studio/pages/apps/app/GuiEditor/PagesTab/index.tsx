import { type BlockDefinition, type BlockManifest } from '@appsemble/types';
import { normalizeBlockName } from '@appsemble/utils';
import {
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

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
  docRef: MutableRefObject<Document<ParsedNode>>;
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

export function PagesTab({ docRef, isOpenLeft, isOpenRight }: PagesTabProps): ReactElement {
  const { app, setApp } = useApp();
  const [saveStack, setSaveStack] = useState([docRef.current.clone()]);
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

  const getIndex = (): number => index;

  const getStackSize = (): number => saveStack.length - 1;

  useEffect(() => {
    setApp({ ...app, definition: state.toJS() });
  }, [app, index, setApp, state]);

  const addSaveState = useCallback((): void => {
    const copy = saveStack.slice(0, index + 1);
    copy.push(docRef.current.clone());
    setSaveStack(copy);
    setIndex(copy.length - 1);
  }, [docRef, saveStack, index, setIndex, setSaveStack]);

  const onUndo = (): void => {
    setIndex(Math.max(0, index - 1));
  };

  const onRedo = (): void => {
    setIndex(Math.min(saveStack.length - 1, index + 1));
  };

  const deleteIn = (path: Iterable<unknown>): void => {
    docRef.current.deleteIn(path);
    addSaveState();
  };

  const addIn = (path: Iterable<unknown>, value: Node): void => {
    docRef.current.addIn(path, value);
    addSaveState();
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

  const addBlock = (nb: BlockDefinition): void => {
    const doc = docRef.current;
    const newBlockNode = doc.createNode(nb);
    const pageBlocks = doc.getIn(['pages', selectedPage, 'blocks']) as YAMLSeq;
    const newBlockIndex = pageBlocks.items.length;
    addIn(['pages', selectedPage, 'blocks'], newBlockNode);
    onChangePagesBlocks(selectedPage, 0, newBlockIndex);
  };

  const deleteBlock = (): void => {
    deleteIn(['pages', selectedPage, 'blocks', selectedBlock]);
    onChangePagesBlocks(selectedPage, 0, selectedBlock - 1);
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
          getIndex={getIndex}
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
