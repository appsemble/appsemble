import { Title } from '@appsemble/react-components';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import styles from './index.module.css';

interface HeaderControlProps extends ComponentPropsWithoutRef<typeof Title> {
  /**
   * The control to render on the right.
   */
  readonly control: ReactNode;

  /**
   * The class to apply to the wrapper.
   */
  readonly className?: string;

  /**
   * The class to apply to the title element.
   */
  readonly titleClassName?: string;
}

/**
 * A default header layout containing a title on the left and a button on the right.
 */
export function HeaderControl({
  className,
  control,
  titleClassName,
  ...props
}: HeaderControlProps): ReactNode {
  return (
    <header className={`is-flex ${styles.root} ${className}`}>
      <Title className={`is-marginless ${titleClassName}`} {...props} />
      {control}
    </header>
  );
}
