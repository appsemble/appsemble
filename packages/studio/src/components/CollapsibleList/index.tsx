import { Button, Title, useToggle } from '@appsemble/react-components';
import classNames from 'classnames';
import { Children, ElementType, ReactElement, ReactNode } from 'react';

import styles from './index.module.css';

interface CollapsibleListProps {
  title: ReactElement | string;
  children: ReactNode;
  noData: ReactNode;
  wrapper?: ElementType;
}

export function CollapsibleList({
  children,
  noData,
  title,
  wrapper = 'ul',
}: CollapsibleListProps): ReactElement {
  const collapsed = useToggle();
  const Wrapper: ElementType = wrapper;

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
      {Children.count(children) ? (
        <div className={classNames([styles.list, { 'is-hidden': collapsed.enabled }])}>
          <Wrapper>{children}</Wrapper>
        </div>
      ) : (
        { noData }
      )}
    </>
  );
}
