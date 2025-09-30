import { type BulmaColor, type BulmaSize } from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ReactNode } from 'react';

import { Icon } from '../index.js';

interface ButtonChildrenProps {
  /**
   * Children to render
   */
  readonly children?: ReactNode;

  /**
   * A Font Awesome icon name to render left of the button text.
   */
  readonly icon?: IconName;

  /**
   * The position of the icon.
   *
   * @default 'left'
   */
  readonly iconPosition?: 'left' | 'right';

  /**
   * The size that should be used for the button’s icons.
   */
  readonly iconSize?: Exclude<BulmaSize, 'normal'>;

  /**
   * The size modifier that should be used for the button’s icons.
   */
  readonly iconSizeModifier?: '2x' | '3x' | 'lg';

  /**
   * The color that should be used for the button's icons.
   */
  readonly iconColor?: BulmaColor;
}

/**
 * Various button-like Bulma components have a layout where children may be rendered with an
 * optional icon. If the icon is specified, the DOM layout is different. This component handles
 * abstracts that.
 */
export function ButtonChildren({
  children,
  icon,
  iconColor,
  iconPosition,
  iconSize,
  iconSizeModifier,
}: ButtonChildrenProps): ReactNode {
  return icon ? (
    <>
      {iconPosition === 'left' && (
        <Icon color={iconColor} icon={icon} iconSize={iconSizeModifier} size={iconSize} />
      )}
      {children ? <span>{children}</span> : null}
      {iconPosition === 'right' && (
        <Icon color={iconColor} icon={icon} iconSize={iconSizeModifier} size={iconSize} />
      )}
    </>
  ) : (
    (children as ReactNode)
  );
}
