import { type MutableRefObject, type ReactNode, type Ref, useCallback, useState } from 'react';
import { type Document, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { StyleList } from './StyleList/index.js';
import { StylePage } from './StylePage/index.js';
import { AppPreview } from '../../../../../components/AppPreview/index.js';
import { useApp } from '../../index.js';
import { Sidebar } from '../Components/Sidebar/index.js';

interface StyleTabProps {
  readonly coreStyle: string;
  readonly saveStack: Document<ParsedNode, true>;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly frameRef: Ref<HTMLIFrameElement>;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
  readonly setCoreStyle: (style: string) => void;
  readonly selectedResolution: string;
}
export function StyleTab({
  coreStyle,
  docRef,
  frameRef,
  isOpenLeft,
  isOpenRight,
  saveStack,
  selectedResolution,
  setCoreStyle,
}: StyleTabProps): ReactNode {
  const { app } = useApp();
  const [selectedPage, setSelectedPage] = useState<number>(-1);
  const [selectedBlock, setSelectedBlock] = useState<number>(-1);
  const [selectedSubPage, setSelectedSubPage] = useState<number>(-1);
  const [selectedProp, setSelectedProp] = useState<string>(null);

  const onChangePagesBlocks = useCallback(
    (page: number, subParent: number, block: number, propName?: string) => {
      setSelectedPage(page);
      setSelectedBlock(block);
      setSelectedSubPage(subParent);
      if (propName) {
        setSelectedProp(propName);
      } else {
        setSelectedProp(null);
      }
    },
    [setSelectedPage, setSelectedBlock, setSelectedSubPage],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <StyleList
          onChange={onChangePagesBlocks}
          saveStack={saveStack}
          selectedBlock={selectedBlock}
          selectedPage={selectedPage}
          selectedProp={selectedProp}
          selectedSubParent={selectedSubPage}
        />
      </Sidebar>
      <div
        className={`${styles.root} ${
          selectedResolution === 'fullscreen'
            ? styles.fullscreen
            : selectedResolution === 'desktop'
              ? styles.desktop
              : selectedResolution === 'phone'
                ? styles.phone
                : ''
        }`}
      >
        <AppPreview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          <StylePage
            coreStyle={coreStyle}
            docRef={docRef}
            selectedBlock={selectedBlock}
            selectedPage={selectedPage}
            selectedProp={selectedProp}
            selectedSubParent={selectedSubPage}
            setCoreStyle={setCoreStyle}
          />
        </div>
      </Sidebar>
    </>
  );
}
