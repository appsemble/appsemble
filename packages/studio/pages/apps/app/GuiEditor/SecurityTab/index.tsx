import { Button } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { CreateRolePage } from './CreateRolePage/index.js';
import { DefaultPage } from './DefaultPage/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RolesPage } from './RolesPage/index.js';
import { TeamsPage } from './TeamsPage/index.js';
import { AppPreview } from '../../../../../components/AppPreview/index.js';
import { useFullscreenContext } from '../../../../../components/FullscreenProvider/index.js';
import { useApp } from '../../index.js';
import { Sidebar } from '../Components/Sidebar/index.js';
import { TreeList } from '../Components/TreeList/index.js';

interface SecurityTabProps {
  readonly isOpenLeft: boolean;
  readonly isOpenRight: boolean;
  readonly selectedAspectRatio: string;
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
  isOpenLeft,
  isOpenRight,
  selectedAspectRatio: selectedRatio,
}: SecurityTabProps): ReactNode {
  const { formatMessage } = useIntl();
  const { app } = useApp();
  const frame = useRef<HTMLIFrameElement>();
  const [currentSideBar, setCurrentSideBar] = useState<LeftSidebar>(Tabs[0]);
  const [selectedRole, setSelectedRole] = useState<string>(null);
  const { fullscreen } = useFullscreenContext();

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
      <div
        className={classNames(`${styles.root} ${styles[selectedRatio]}`, {
          [String(styles.fullscreen)]: fullscreen.enabled,
        })}
        id="appPreviewDiv"
      >
        <AppPreview app={app} iframeRef={frame} />
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
