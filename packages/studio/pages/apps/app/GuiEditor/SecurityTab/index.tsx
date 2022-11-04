<<<<<<< HEAD
import { Button, useMessages, useToggle } from '@appsemble/react-components';
import {
  BasicPageDefinition,
  ResourceCall,
  ResourceDefinition,
  RoleDefinition,
} from '@appsemble/types';
import { ChangeEvent, ReactElement, useCallback, useRef, useState } from 'react';
=======
import { ReactElement } from 'react';
>>>>>>> 84b170508 (Add general tab)
import { useIntl } from 'react-intl';

import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { TreeList } from '../Components/TreeList/index.js';
import { CreateRolePage } from './CreateRolePage/index.js';
import { DefaultPage } from './DefaultPage/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesPage } from './RolesPage/index.js';
import { TeamsPage } from './TeamsPage/index.js';

interface SecurityTabProps {
  isOpenLeft: boolean;
  isOpenRight: boolean;
}

const Tabs = [
  {
    tab: 'default',
    title: messages.defaultTab,
  },
  {
    tab: 'teams',
    title: messages.teamsTab,
  },
  {
    tab: 'roles',
    title: messages.rolesTab,
  },
] as const;
type LeftSidebar = (typeof Tabs)[number];

export function SecurityTab({ isOpenLeft, isOpenRight }: SecurityTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const [selectedRole, setSelectedRole] = useState<string>(null);
  const [editRoleName, setEditRoleName] = useState<string>(null);
  const [newRoleName, setNewRoleName] = useState<string>(null);
  const [createRoleName, setCreateRoleName] = useState<string>(null);
  const [createRoleDefinition, setCreateRoleDefinition] = useState<RoleDefinition>(null);
  const modalRoleName = useToggle();
  const push = useMessages();

  const onChangeTab = useCallback(
    (tab: (typeof tabChangeOptions)[number]) => {
      if (tab === 'createRole') {
        setCurrentSideBar(Tabs[2]);
        setSelectedRole(null);
      } else {
        setCurrentSideBar(Tabs.find(({ tab: t }) => t === tab));
      }
    },
    [setCurrentSideBar, setSelectedRole],
  );

  const onRoleSelect = useCallback(
    (index: number) => {
      setSelectedRole(
        Object.entries(app.definition.security?.roles || []).map(([key]) => key)[index],
      );
      setCurrentSideBar(Tabs[2]);
    },
    [app],
  );

  return (
    <>
      <Sidebar isOpen={isOpenLeft} type="left">
        <>
          {Tabs.map((sidebar) => {
            if (sidebar.tab === 'roles') {
              return (
                <TreeList
                  isSelected={currentSideBar.tab === 'roles'}
                  key={sidebar.tab}
                  label={formatMessage(sidebar.title)}
                  onChange={onRoleSelect}
                  onClick={() => {
                    setCurrentSideBar(sidebar);
                    setSelectedRole('');
                  }}
                  options={Object.entries(app.definition.security?.roles || []).map(([key]) => key)}
                  value={selectedRole}
                />
              );
            }
            return (
              <Button
                className={`${styles.leftBarButton} ${currentSideBar === sidebar ? 'is-link' : ''}`}
                key={sidebar.tab}
                onClick={() => setCurrentSideBar(sidebar)}
              >
                {formatMessage(sidebar.title)}
              </Button>
            );
          })}
        </>
      </Sidebar>
      <div className={styles.root}>
        <Preview app={app} iframeRef={frame} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          {currentSideBar.tab === 'default' && <DefaultPage onChangeTab={onChangeTab} />}
          {currentSideBar.tab === 'teams' && <TeamsPage onChangeTab={onChangeTab} />}
          {currentSideBar.tab === 'roles' && selectedRole ? (
            <RolesPage selectedRole={selectedRole} />
          ) : null}
          {currentSideBar.tab === 'roles' && !selectedRole ? <CreateRolePage /> : null}
        </div>
      </Sidebar>
    </>
  );
}
