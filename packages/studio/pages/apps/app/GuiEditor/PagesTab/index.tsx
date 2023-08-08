import { useMessages } from '@appsemble/react-components';
import { type BlockDefinition, type BlockManifest } from '@appsemble/types';
import { type MutableRefObject, type ReactElement, type Ref, useCallback, useState } from 'react';
import { type JsonObject } from 'type-fest';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

import BlockProperty from './BlockProperty/index.js';
import { BlockStore } from './BlockStore/index.js';
import { ElementsList } from './ElementsList/index.js';
import styles from './index.module.css';
import { PageProperty } from './PageProperty/index.js';
import SubPageProperty from './SubPageProperty/index.js';
import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { generateData } from '../Utils/schemaGenerator.js';

interface PagesTabProps {
  readonly addIn: (path: Iterable<unknown>, value: Node) => void;
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deleteIn: (path: Iterable<unknown>) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly frameRef: Ref<HTMLIFrameElement>;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
}

export function PagesTab({
  addIn,
  changeIn,
  deleteIn,
  docRef,
  frameRef,
  isOpenLeft,
  isOpenRight,
}: PagesTabProps): ReactElement {
  const { app } = useApp();
  const push = useMessages();
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubParent, setSelectedSubParent] = useState<number>(-1);
  const [editPageView, setEditPageView] = useState<boolean>(false);
  const [editSubPageView, setEditSubPageView] = useState<boolean>(false);
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

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubParent(subParent);
      if (block !== -1) {
        setEditPageView(false);
        setEditBlockView(true);
        setEditSubPageView(false);
        return;
      }
      if (page !== -1 && block === -1 && subParent === -1) {
        setEditPageView(true);
        setEditBlockView(false);
        setEditSubPageView(false);
      }
      if (page !== -1 && block === -1 && subParent !== -1) {
        setEditPageView(false);
        setEditBlockView(false);
        setEditSubPageView(true);
      }
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubParent],
  );

  const onCreatePage = useCallback(() => {
    setEditPageView(true);
    setEditBlockView(false);
    setSelectedPage(-1);
  }, [setEditPageView, setEditBlockView]);

  const getPagesBlocks = (): YAMLSeq => {
    const doc = docRef.current;
    if (
      !doc.getIn(['pages', selectedPage, 'type']) ||
      doc.getIn(['pages', selectedPage, 'type']) === 'page'
    ) {
      return doc.getIn(['pages', selectedPage, 'blocks']) as YAMLSeq;
    }
    return doc.getIn([
      'pages',
      selectedPage,
      doc.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
      selectedSubParent >= 0 ? selectedSubParent : 0,
      'blocks',
    ]) as YAMLSeq;
  };

  const getBlockPath = useCallback((): unknown[] => {
    const doc = docRef.current;
    if (
      !doc.getIn(['pages', selectedPage, 'type']) ||
      doc.getIn(['pages', selectedPage, 'type']) === 'page'
    ) {
      return ['pages', selectedPage, 'blocks'];
    }
    if (doc.getIn(['pages', selectedPage, 'type']) === 'flow') {
      return [
        'pages',
        selectedPage,
        'steps',
        selectedSubParent >= 0 ? selectedSubParent : 0,
        'blocks',
      ];
    }
    if (doc.getIn(['pages', selectedPage, 'type']) === 'tabs') {
      return [
        'pages',
        selectedPage,
        'tabs',
        selectedSubParent >= 0 ? selectedSubParent : 0,
        'blocks',
      ];
    }
  }, [docRef, selectedPage, selectedSubParent]);

  const getSelectedBlock = useCallback((): Document<ParsedNode> => {
    const doc = docRef.current;
    return doc.getIn([...getBlockPath(), selectedBlock]) as Document<ParsedNode>;
  }, [docRef, getBlockPath, selectedBlock]);

  const addBlock = (nb: BlockDefinition): void => {
    const doc = docRef.current;
    const newBlockNode = doc.createNode(nb);
    const pageBlocks = getPagesBlocks();
    try {
      const newBlockIndex = pageBlocks.items.length;

      addIn(getBlockPath(), newBlockNode);
      onChangePagesBlocks(selectedPage, selectedSubParent, newBlockIndex);
    } catch {
      if (selectedPage === -1) {
        push({
          body: 'Please select a page to add the new block into',
          color: 'danger',
        });
      } else if (
        doc.getIn(['pages', selectedPage, 'type']) &&
        doc.getIn(['pages', selectedPage, 'type']) !== 'page'
      ) {
        push({
          body: 'A block can only be added into a sub-page',
          color: 'danger',
        });
      } else {
        push({
          body: 'An unexpected error occurred while adding a new block',
          color: 'danger',
        });
      }
    }
  };

  const deleteBlock = useCallback(() => {
    deleteIn([...getBlockPath(), selectedBlock]);
    onChangePagesBlocks(selectedPage, selectedSubParent, selectedBlock - 1);
  }, [deleteIn, getBlockPath, onChangePagesBlocks, selectedBlock, selectedPage, selectedSubParent]);

  const deletePage = useCallback(() => {
    deleteIn(['pages', selectedPage]);
    onChangePagesBlocks(selectedPage - 1, selectedSubParent, selectedBlock);
  }, [deleteIn, onChangePagesBlocks, selectedBlock, selectedPage, selectedSubParent]);

  const deleteSubPage = useCallback(() => {
    const doc = docRef.current;
    deleteIn([
      'pages',
      selectedPage,
      doc.getIn(['pages', selectedPage, 'type']) === 'flow' ? 'steps' : 'tabs',
      selectedSubParent,
    ]);
    onChangePagesBlocks(selectedPage, selectedSubParent - 1, selectedBlock);
  }, [deleteIn, docRef, onChangePagesBlocks, selectedBlock, selectedPage, selectedSubParent]);

  const changeProperty = (parameters: JsonObject): void => {
    const doc = docRef.current;
    changeIn([...getBlockPath(), selectedBlock, 'parameters'], doc.createNode(parameters) as Node);
  };

  const changeBlockType = (blockType: BlockManifest): void => {
    const doc = docRef.current;
    const newBlockType = {
      type: blockType.name,
      version: blockType.version,
      parameters: generateData(blockType.parameters.definitions, blockType.parameters),
    } as BlockDefinition;
    changeIn([...getBlockPath(), selectedBlock], doc.createNode(newBlockType) as Node);
  };

  const handleDrop = (): void => {
    setDropzoneActive(false);
    const newBlock = {
      type: blockManifest.name,
      version: blockManifest.version,
      parameters: generateData(blockManifest.parameters.definitions, blockManifest.parameters),
    } as BlockDefinition;
    addBlock(newBlock);
  };

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <ElementsList
          changeIn={changeIn}
          docRef={docRef}
          onChange={onChangePagesBlocks}
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
        <Preview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          {editPageView ? (
            <PageProperty
              addIn={addIn}
              changeIn={changeIn}
              deleteIn={deleteIn}
              deletePage={deletePage}
              docRef={docRef}
              selectedPage={selectedPage}
              selectedSubPage={selectedSubParent}
            />
          ) : null}
          {editSubPageView ? (
            <SubPageProperty
              changeIn={changeIn}
              deletePage={deleteSubPage}
              docRef={docRef}
              selectedPage={selectedPage}
              selectedSubPage={selectedSubParent}
            />
          ) : null}
          {editBlockView ? (
            <BlockProperty
              changeProperty={changeProperty}
              changeType={changeBlockType}
              deleteBlock={deleteBlock}
              selectedBlock={getSelectedBlock()}
            />
          ) : null}
        </div>
        <BlockStore dragEventListener={onDragEvent} />
      </Sidebar>
    </>
  );
}
