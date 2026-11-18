import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import { useLocation } from 'wouter-preact';

import styles from './index.module.css';
import { shouldShowMenu } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

type MainProps = ComponentProps<'main'>;

export function Main({ className, ...props }: MainProps): VNode {
  const { definition } = useAppDefinition();
  const { appMemberRoles, appMemberSelectedGroup } = useAppMember();
  const { getAppMessage } = useAppMessages();
  const [pathname] = useLocation();

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
