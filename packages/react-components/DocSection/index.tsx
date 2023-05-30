import { Fragment, type ReactElement, type ReactNode, useCallback, useState } from 'react';

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
              <button onClick={clickHideButton} type="button">
                <Icon icon="chevron-down" />
                {child}
              </button>
            </Fragment>
          );
        }
        if (!hideChildren) {
          return child;
        }
      })}
      <span />
    </>
  );
}
