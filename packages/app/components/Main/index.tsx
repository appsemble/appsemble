import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { shouldShowMenu } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

type MainProps = ComponentPropsWithoutRef<'main'>;

export function Main({ className, ...props }: MainProps): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const { pathname } = useLocation();

  const hasBottomNav = useMemo(
    () =>
      definition?.layout?.navigation === 'bottom' &&
      shouldShowMenu(definition, appMemberRoles, appMemberSelectedGroup, pathname, getAppMessage),
    [definition, appMemberRoles, appMemberSelectedGroup, pathname, getAppMessage],
  );

  return (
    <main
      className={classNames(className, {
        [styles.hasBottomNav]: hasBottomNav,
      })}
      {...props}
    />
  );
}
