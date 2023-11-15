import classNames from 'classnames';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo } from 'react';

import styles from './index.module.css';
import { shouldShowMenu } from '../../utils/layout.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useUser } from '../UserProvider/index.js';

type MainProps = ComponentPropsWithoutRef<'main'>;

export function Main({ className, ...props }: MainProps): ReactNode {
  const { definition } = useAppDefinition();
  const { role, teams } = useUser();

  const hasBottomNav = useMemo(
    () => definition?.layout?.navigation === 'bottom' && shouldShowMenu(definition, role, teams),
    [definition, role, teams],
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
