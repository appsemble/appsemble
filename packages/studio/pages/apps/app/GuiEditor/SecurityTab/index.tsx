import { Button } from '@appsemble/react-components';
import { ReactElement, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { useApp } from '../../index.js';
import { InputList } from '../Components/InputList/index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface SecurityTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}
const defaultTab = {
  tab: 'default',
  title: messages.defaultTab,
};
const teamsTab = {
  tab: 'teams',
  title: messages.teamsTab,
};
const rolesTab = {
  tab: 'roles',
  title: messages.rolesTab,
};
const Tabs = [defaultTab, teamsTab, rolesTab] as const;
type LeftSidebar = typeof Tabs[number];

const policyOptions = ['everyone', 'organization', 'invite'] as const;

export function SecurityTab({ isOpenLeft, isOpenRight }: SecurityTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app, setApp } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(defaultTab);

  const onChangeDefaultPolicy = useCallback(
    (index: number) => {
      if (!app.definition.security) {
        setApp({
          ...app,
          definition: {
            ...app.definition,
            security: {
              ...app.definition.security,
              default: { ...app.definition.security.default, policy: policyOptions[index] },
            },
          },
        });
      }
    },
    [app, setApp],
  );

  const onChangeDefaultRole = useCallback(
    (index: number) => {
      if (!app.definition.security) {
        setApp({
          ...app,
          definition: {
            ...app.definition,
            security: {
              ...app.definition.security,
              default: {
                ...app.definition.security.default,
                role: Object.entries(app.definition.security?.roles || []).map(([key]) => key)[
                  index
                ],
              },
            },
          },
        });
      }
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
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <>
          {currentSideBar.tab === 'default' && (
            <div className={styles.rightBar}>
              <InputList
                label={formatMessage(messages.defaultRoleLabel)}
                labelPosition="top"
                onChange={onChangeDefaultRole}
                options={Object.entries(app.definition.security?.roles || []).map(([key]) => key)}
                value={app.definition.security?.default.role || ''}
              />
              <InputList
                label={formatMessage(messages.defaultPolicyLabel)}
                labelPosition="top"
                onChange={onChangeDefaultPolicy}
                options={policyOptions}
                value={app.definition.security?.default.policy || ''}
              />
              {!app.definition.security?.roles && (
                <>
                  <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
                  <Button
                    className="is-primary"
                    icon="add"
                    onClick={() => setCurrentSideBar(rolesTab)}
                  >
                    {formatMessage(messages.defaultCreateNewRole)}
                  </Button>
                </>
              )}
            </div>
          )}
          {currentSideBar.tab === 'teams' && <div />}
          {currentSideBar.tab === 'roles' && <div />}
        </>
      </Sidebar>
    </>
  );
}
