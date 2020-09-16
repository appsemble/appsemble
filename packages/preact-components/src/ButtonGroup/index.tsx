import classNames from 'classnames';
import { ComponentProps, h, VNode } from 'preact';

import { ValuePickerProvider } from '..';

interface ButtonGroupProps extends ComponentProps<typeof ValuePickerProvider> {
  className?: string;
}

export function ButtonGroup({ className, ...props }: ButtonGroupProps): VNode {
  return (
    <div className={classNames('buttons has-addons', className)}>
      <ValuePickerProvider {...props} />
    </div>
  );
}
