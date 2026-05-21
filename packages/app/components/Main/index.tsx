import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { shouldShowMenu } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';

type MainProps = ComponentPropsWithoutRef<'main'>;

export function Main({ className, ...props }: MainProps): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberRole, appMemberSelectedGroup } = useAppMember();
  const { pathname } = useLocation();

  const hasBottomNav = useMemo(
    () =>
      definition?.layout?.navigation === 'bottom' &&
      shouldShowMenu(definition, appMemberRole, appMemberSelectedGroup, pathname),
    [definition, appMemberRole, appMemberSelectedGroup, pathname],
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
