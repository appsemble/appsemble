import { Button } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { useApp } from '../../index.js';
import { InputList } from '../Components/InputList/index.js';
import { InputString } from '../Components/InputString/index.js';
import { InputTextArea } from '../Components/InputTextArea/index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
<<<<<<< HEAD
import styles from './index.module.css';
import { messages } from './messages.js';
=======
import { GuiEditorTabs } from '../index.js';
>>>>>>> 58d2017e1 (Remove unused files)

export interface GeneralTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

const languages = [
  { value: 'en', label: messages.english },
  { value: 'nl', label: messages.dutch },
];

const notificationOptions = ['none', 'opt-in', 'startup'];

const loginOptions = ['navbar', 'navigation', 'hidden'] as const;
const settingsOptions = ['navbar', 'navigation', 'hidden'] as const;
const feedBackOptions = ['navigation', 'navbar', 'hidden'] as const;
const navigationOptions = ['left-menu', 'bottom', 'hidden'] as const;

const Tabs = [
  {
    tab: 'general',
    title: messages.general,
  },
  {
    tab: 'layout',
    title: messages.layout,
  },
  {
    tab: 'schedule',
    title: messages.schedule,
  },
] as const;

type LeftSidebar = (typeof Tabs)[number];

export function GeneralTab({ isOpenLeft, isOpenRight }: GeneralTabProps): ReactElement {
  const { app, setApp } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const { formatMessage } = useIntl();

  const onNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, value: string) => {
      app.definition.name = value;
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>, value: string) => {
      app.definition.description = value;
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onDefaultPageChange = useCallback(
    (index: number) => {
      app.definition.defaultPage = app.definition.pages[index].name;
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeDefaultLanguage = useCallback(
    (index: number) => {
      app.definition.defaultLanguage = languages[index].value;
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeNotificationsOption = useCallback(
    (index: number) => {
      if (index === 0) {
        delete app.definition.notifications;
        setApp({ ...app });
        return;
      }
      if (notificationOptions[index] === 'opt-in') {
        app.definition.notifications = 'opt-in';
        setApp({ ...app });
        return;
      }
      if (notificationOptions[index] === 'startup') {
        app.definition.notifications = 'startup';
        setApp({ ...app });
      }
    },
    [app, setApp],
  );

  const onChangeLoginOption = useCallback(
    (index: number) => {
      if (!app.definition.layout) {
        app.definition.layout = {};
      }
      app.definition.layout.login = loginOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeSettingsOption = useCallback(
    (index: number) => {
      if (!app.definition.layout) {
        app.definition.layout = {};
      }
      app.definition.layout.settings = settingsOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeFeedbackOption = useCallback(
    (index: number) => {
      if (!app.definition.layout) {
        app.definition.layout = {};
      }
      app.definition.layout.feedback = feedBackOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
  );

  const onChangeNavigationOption = useCallback(
    (index: number) => {
      if (!app.definition.layout) {
        app.definition.layout = {};
      }
      app.definition.layout.navigation = navigationOptions[index];
      setApp({ ...app });
    },
    [app, setApp],
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
<<<<<<< HEAD
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
=======
      <div>{tab.title}</div>
>>>>>>> 58d2017e1 (Remove unused files)
      <Sidebar isOpen={isOpenRight} type="right">
        <>
          {currentSideBar.tab === 'general' && (
            <div className={styles.rightBar}>
              <InputString
                label={formatMessage(messages.nameLabel)}
                maxLength={30}
                minLength={1}
                onChange={onNameChange}
                value={app.definition.name}
              />
              <InputTextArea
                allowSymbols
                label={formatMessage(messages.descriptionLabel)}
                maxLength={80}
                minLength={1}
                onChange={onDescriptionChange}
                value={app.definition.description}
              />
              <InputList
                label={formatMessage(messages.defaultPageLabel)}
                labelPosition="top"
                onChange={onDefaultPageChange}
                options={app.definition.pages.map((option) => option.name)}
                value={app.definition.defaultPage}
              />
              <InputList
                label={formatMessage(messages.defaultLanguageLabel)}
                labelPosition="top"
                onChange={onChangeDefaultLanguage}
                options={languages.map((option) => formatMessage(option.label))}
                value={app.definition.defaultLanguage || languages[0].value}
              />
              <InputList
                label={formatMessage(messages.notificationsLabel)}
                labelPosition="top"
                onChange={onChangeNotificationsOption}
                options={notificationOptions}
                value={app.definition.notifications || notificationOptions[0]}
              />
            </div>
          )}

          {currentSideBar.tab === 'layout' && (
            <div className={styles.rightBar}>
              <InputList
                label={formatMessage(messages.loginLabel)}
                labelPosition="top"
                onChange={onChangeLoginOption}
                options={loginOptions}
                value={app.definition.layout?.login || loginOptions[0]}
              />
              <InputList
                label={formatMessage(messages.settingsLabel)}
                labelPosition="top"
                onChange={onChangeSettingsOption}
                options={settingsOptions}
                value={app.definition.layout?.settings || settingsOptions[0]}
              />
              <InputList
                label={formatMessage(messages.feedbackLabel)}
                labelPosition="top"
                onChange={onChangeFeedbackOption}
                options={feedBackOptions}
                value={app.definition.layout?.feedback || feedBackOptions[0]}
              />
              <InputList
                label={formatMessage(messages.navigationLabel)}
                labelPosition="top"
                onChange={onChangeNavigationOption}
                options={navigationOptions}
                value={app.definition.layout?.navigation || navigationOptions[0]}
              />
            </div>
          )}
          {currentSideBar.tab === 'schedule' && <div className={styles.rightBar} />}
        </>
      </Sidebar>
    </>
  );
}
