import { Button } from '@appsemble/react-components';
import { type MutableRefObject, type ReactElement, type Ref, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import { CreateRolePage } from './CreateRolePage/index.js';
import { DefaultPage } from './DefaultPage/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesPage } from './RolesPage/index.js';
import { TeamsPage } from './TeamsPage/index.js';
import { useApp } from '../../index.js';
import { Preview } from '../Components/Preview/index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { TreeList } from '../Components/TreeList/index.js';

interface SecurityTabProps {
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  deleteIn: (path: Iterable<unknown>) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  frameRef: Ref<HTMLIFrameElement>;
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
export const tabChangeOptions = ['default', 'teams', 'roles', 'createRole'] as const;

export function SecurityTab({
  changeIn,
  deleteIn,
  docRef,
  frameRef,
  isOpenLeft,
  isOpenRight,
}: SecurityTabProps): ReactElement {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const [selectedRole, setSelectedRole] = useState<string>(null);

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
        Object.entries(docRef.current.getIn(['security', 'roles']) || []).map(([key]) => key)[
          index
        ],
      );
      setCurrentSideBar(Tabs[2]);
    },
    [docRef],
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
                  options={Object.entries(docRef.current.getIn(['security', 'roles']) || []).map(
                    ([key]) => key,
                  )}
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
        <Preview app={app} iframeRef={frameRef} />
      </div>
      <Sidebar isOpen={isOpenRight} type="right">
        <div className={styles.rightBar}>
          {currentSideBar.tab === 'default' && (
            <DefaultPage changeIn={changeIn} docRef={docRef} onChangeTab={onChangeTab} />
          )}
          {currentSideBar.tab === 'teams' && <TeamsPage onChangeTab={onChangeTab} />}
          {currentSideBar.tab === 'roles' && selectedRole ? (
            <RolesPage
              changeIn={changeIn}
              deleteIn={deleteIn}
              docRef={docRef}
              selectedRole={selectedRole}
            />
          ) : null}
          {currentSideBar.tab === 'roles' && !selectedRole ? (
            <CreateRolePage changeIn={changeIn} docRef={docRef} />
          ) : null}
        </div>
      </Sidebar>
    </>
  );
}
