import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactNode,
  type Ref,
  useCallback,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppPreview } from '../../../../../components/AppPreview/index.js';
import { useFullscreenContext } from '../../../../../components/FullscreenProvider/index.js';
import { useApp } from '../../index.js';
import { InputList } from '../Components/InputList/index.js';
import { InputString } from '../Components/InputString/index.js';
import { InputTextArea } from '../Components/InputTextArea/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';

export interface GeneralTabProps {
  readonly changeIn: (path: Iterable<unknown>, value: Node) => void;
  readonly deleteIn: (path: Iterable<unknown>) => void;
  readonly docRef: MutableRefObject<Document<ParsedNode>>;
  readonly frameRef: Ref<HTMLIFrameElement>;
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
  readonly selectedScreenRatio: string;
}

const languages = [
  { value: 'en', label: messages.english },
  { value: 'nl', label: messages.dutch },
];

const notificationOptions = ['none', 'opt-in', 'startup'];

const Tabs = [
  {
    tab: 'general',
    title: messages.general,
  },
  {
    tab: 'schedule',
    title: messages.schedule,
  },
] as const;

type LeftSidebar = (typeof Tabs)[number];

export function GeneralTab({
  changeIn,
  deleteIn,
  docRef,
  frameRef,
  isOpenLeft,
  isOpenRight,
  selectedScreenRatio: selectedRatio,
}: GeneralTabProps): ReactNode {
  const { app } = useApp();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const { formatMessage } = useIntl();
  const { fullscreen } = useFullscreenContext();

  const onNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      const doc = docRef.current;
      changeIn(['name'], doc.createNode(value) as Node);
    },
    [changeIn, docRef],
  );

  const onDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>, value: string) => {
      const doc = docRef.current;
      changeIn(['description'], doc.createNode(value) as Node);
    },
    [changeIn, docRef],
  );

  const onDefaultPageChange = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['defaultPage'], doc.createNode(doc.getIn(['pages', index, 'name'])) as Node);
    },
    [changeIn, docRef],
  );

  const onChangeDefaultLanguage = useCallback(
    (index: number) => {
      const doc = docRef.current;
      changeIn(['defaultLanguage'], doc.createNode(languages[index].value));
    },
    [changeIn, docRef],
  );

  const onChangeNotificationsOption = useCallback(
    (index: number) => {
      const doc = docRef.current;
      if (index === 0) {
        deleteIn(['notifications']);
        return;
      }
      if (notificationOptions[index] === 'opt-in') {
        changeIn(['notifications'], doc.createNode('opt-in'));
        return;
      }
      if (notificationOptions[index] === 'startup') {
        changeIn(['notifications'], doc.createNode('startup'));
      }
    },
    [changeIn, deleteIn, docRef],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <>
          {Tabs.map((sidebar) => (
            <Button
              className={`${styles.leftBarButton} ${currentSideBar === sidebar ? 'is-link' : ''}`}
              key={sidebar.tab}
              onClick={() => setCurrentSideBar(sidebar)}
            >
              {formatMessage(sidebar.title)}
            </Button>
          ))}
        </>
      </Sidebar>
      <div
        className={classNames(`${styles.root} ${styles[selectedRatio]}`, {
          [String(styles.fullscreen)]: fullscreen.enabled,
        })}
        id="appPreviewDiv"
      >
        <AppPreview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <>
          {currentSideBar.tab === 'general' && (
            <div className={styles.rightBar}>
              <InputString
                label={formatMessage(messages.nameLabel)}
                maxLength={30}
                minLength={1}
                onChange={onNameChange}
                value={docRef.current.getIn(['name'], true) as string}
              />
              <InputTextArea
                allowSymbols
                label={formatMessage(messages.descriptionLabel)}
                maxLength={80}
                minLength={1}
                onChange={onDescriptionChange}
                value={docRef.current.getIn(['description'], true) as string}
              />
              <InputList
                label={formatMessage(messages.defaultPageLabel)}
                labelPosition="top"
                onChange={onDefaultPageChange}
                options={docRef.current.toJS().pages.map((item: any) => item.name)}
                value={docRef.current.toJS().defaultPage}
              />
              <InputList
                label={formatMessage(messages.defaultLanguageLabel)}
                labelPosition="top"
                onChange={onChangeDefaultLanguage}
                options={languages.map((option) => formatMessage(option.label))}
                value={docRef.current.toJS().defaultLanguage || languages[0].value}
              />
              <InputList
                label={formatMessage(messages.notificationsLabel)}
                labelPosition="top"
                onChange={onChangeNotificationsOption}
                options={notificationOptions}
                value={docRef.current.toJS().notifications || notificationOptions[0]}
              />
            </div>
          )}
          {currentSideBar.tab === 'schedule' && <div className={styles.rightBar} />}
        </>
      </Sidebar>
    </>
  );
}
