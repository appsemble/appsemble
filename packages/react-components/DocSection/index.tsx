import { Fragment, type ReactElement, type ReactNode, useCallback, useState } from 'react';

import styles from './index.module.css';
import { Icon } from '../Icon/index.js';

interface DocSectionProps {
  children: ReactNode;
}

export function DocSection({ children }: DocSectionProps): ReactElement {
  const [hideChildren, setHideChildren] = useState(false);
  const clickHideButton = useCallback(() => {
    setHideChildren(!hideChildren);
  }, [hideChildren]);

  return (
    <>
      {Object.entries(children).map(([index, child]) => {
        if (index === '0') {
          return (
            <Fragment key={index}>
              <Icon
                className={styles.icon}
                icon={hideChildren ? 'chevron-up' : 'chevron-down'}
                onClick={clickHideButton}
                size="medium"
              />
              {child}
            </Fragment>
          );
        }
        if (!hideChildren) {
          return child;
        }
      })}
    </>
  );
}
