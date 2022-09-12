import { BulmaSize } from '@appsemble/types';
import { IconName } from '@fortawesome/fontawesome-common-types';
import { ReactElement, ReactNode } from 'react';

import { Icon } from '../index.js';

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
   * The size that should be used for the button’s icons.
   */
  iconSize?: Exclude<BulmaSize, 'normal'>;

  /**
   * The size modifier that should be used for the button’s icons.
   */
  iconSizeModifier?: '2x' | '3x' | 'lg';
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
  iconSize,
  iconSizeModifier,
}: ButtonChildrenProps): ReactElement {
  return icon ? (
    <>
      {iconPosition === 'left' && <Icon icon={icon} iconSize={iconSizeModifier} size={iconSize} />}
      {children ? <span>{children}</span> : null}
      {iconPosition === 'right' && <Icon icon={icon} iconSize={iconSizeModifier} size={iconSize} />}
    </>
  ) : (
    (children as ReactElement)
  );
}
