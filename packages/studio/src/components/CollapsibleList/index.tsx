import { Button, Title, useToggle } from '@appsemble/react-components';
import classNames from 'classnames';
import { ReactElement, ReactNode } from 'react';

import styles from './index.module.css';

interface CollapsibleListProps {
  /**
   * The clickable title that is used to toggle showing or hiding the content.
   */
  title: ReactElement | string;

  /**
   * The content to display.
   */
  children: ReactNode;
}

/**
 * Display any content with a clickable header to toggle displaying or hiding it.
 */
export function CollapsibleList({ children, title }: CollapsibleListProps): ReactElement {
  const collapsed = useToggle();

  return (
    <>
      <div className={`${styles.titleContainer} is-flex mb-5`}>
        <Button
          className={`${styles.toggle} pl-0`}
          icon={collapsed.enabled ? 'chevron-right' : 'chevron-down'}
          iconPosition="right"
          onClick={collapsed.toggle}
        >
          <Title className="mb-0" size={4}>
            {title}
          </Title>
        </Button>
      </div>
      <div className={classNames([styles.list, { 'is-hidden': collapsed.enabled }])}>
        {children}
      </div>
    </>
  );
}
