import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { Props } from '../types';
import ValuePickerProvider from '../ValuePickerProvider';

interface ButtonGroupProps extends Props<typeof ValuePickerProvider> {
  className?: string;
}

export default function ButtonGroup({ className, ...props }: ButtonGroupProps): VNode {
  return (
    <div className={classNames('buttons has-addons', className)}>
      <ValuePickerProvider {...props} />
    </div>
  );
}
