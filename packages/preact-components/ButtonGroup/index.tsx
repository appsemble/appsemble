import classNames from 'classnames';
import { type ComponentProps, type VNode } from 'preact';

import { ValuePickerProvider } from '../index.js';

interface ButtonGroupProps extends ComponentProps<typeof ValuePickerProvider> {
  readonly className?: string;
}

export function ButtonGroup({ className, ...props }: ButtonGroupProps): VNode {
  return (
    <div className={classNames('buttons has-addons', className)}>
      <ValuePickerProvider {...props} />
    </div>
  );
}
