import classNames from 'classnames';
import { ComponentPropsWithoutRef, ReactElement, useMemo } from 'react';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.module.css';

type MainProps = ComponentPropsWithoutRef<'main'>;

export function Main({ className, ...props }: MainProps): ReactElement {
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
