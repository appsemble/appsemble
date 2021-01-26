import { Title } from '@appsemble/react-components';
import React, { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import styles from './index.css';

interface HeaderControlProps extends ComponentPropsWithoutRef<typeof Title> {
  /**
   * The control to render on the right.
   */
  control: ReactNode;
}

/**
 * A default header layout containing a title on the left and a button on the right.
 */
export function HeaderControl({ control, ...props }: HeaderControlProps): ReactElement {
  return (
    <header className={`is-flex ${styles.root}`}>
      <Title className="is-marginless" {...props} />
      {control}
    </header>
  );
}
