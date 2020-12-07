import classNames from 'classnames';
import React, { ComponentPropsWithoutRef, ReactElement, useMemo } from 'react';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';

type MainProps = ComponentPropsWithoutRef<'main'>;

export function Main({ className, ...props }: MainProps): ReactElement {
  const { definition } = useAppDefinition();
  const { role } = useUser();

  const hasBottomNav = useMemo(
    () => definition?.layout?.navigation === 'bottom' && shouldShowMenu(definition, role),
    [definition, role],
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
