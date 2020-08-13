import classNames from 'classnames';
import { h, VNode } from 'preact';

import { Props, ValuePickerProvider } from '..';

interface ButtonGroupProps extends Props<typeof ValuePickerProvider> {
  className?: string;
}

export function ButtonGroup({ className, ...props }: ButtonGroupProps): VNode {
  return (
    <div className={classNames('buttons has-addons', className)}>
      <ValuePickerProvider {...props} />
    </div>
  );
}
