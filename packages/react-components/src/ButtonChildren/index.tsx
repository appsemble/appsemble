import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import { ReactElement, ReactNode } from 'react';

import { Icon } from '..';

interface ButtonChildrenProps {
  /**
   * Children to render
   */
  children?: ReactNode;

  /**
   * A Font Awesome icon name to render left of the button text.
   */
  icon?: IconName;

  /**
   * The position of the icon.
   *
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';

  /**
   * The Font Awesome prefix to apply to the icon.
   */
  iconPrefix?: IconPrefix;
}

/**
 * Various button-like Bulma components have a layout where children may be rendered with an
 * optional icon. If the icon is specified, the DOM layout is different. This component handles
 * abstracts that.
 */
export function ButtonChildren({
  children,
  icon,
  iconPosition,
  iconPrefix,
}: ButtonChildrenProps): ReactElement {
  return icon ? (
    <>
      {iconPosition === 'left' && <Icon icon={icon} prefix={iconPrefix} />}
      {children && <span>{children}</span>}
      {iconPosition === 'right' && <Icon icon={icon} prefix={iconPrefix} />}
    </>
  ) : (
    (children as ReactElement)
  );
}
