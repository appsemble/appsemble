import { Button, Title, useToggle } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';

interface CollapsibleProps {
  /**
   * The clickable title that is used to toggle showing or hiding the content.
   */
  readonly title: ReactNode;

  /**
   * The class to apply to the title.
   */
  readonly className?: string;

  /**
   * The header level.
   *
   * By default this is determined by the size.
   */
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * The size of the title.
   *
   * @default 4
   */
  readonly size?: 3 | 4 | 5 | 6;

  /**
   * Whether the component should start out collapsed.
   */
  readonly collapsed?: boolean;

  /**
   * The content to display.
   */
  readonly children: ReactNode;

  /**
   * Help content to display
   */
  readonly help?: ReactNode;
}

/**
 * Display any content with a clickable header to toggle displaying or hiding it.
 */
export function Collapsible({
  children,
  className,
  collapsed: defaultValue = false,
  help,
  level = 2,
  size = 4,
  title,
}: CollapsibleProps): ReactNode {
  const collapsed = useToggle(defaultValue);

  return (
    <>
      <div className={`${styles.titleContainer} is-flex mb-5`}>
        <Button
          className={`${styles.toggle} `}
          icon={collapsed.enabled ? 'chevron-right' : 'chevron-down'}
          iconPosition="right"
          onClick={collapsed.toggle}
        >
          <Title className={classNames('mb-0', className)} level={level} size={size}>
            {title}
          </Title>
        </Button>
      </div>
      <div className="is-size-7 pl-3">{help}</div>
      <div className={classNames('pl-5', { 'is-hidden': collapsed.enabled })}>{children}</div>
    </>
  );
}
