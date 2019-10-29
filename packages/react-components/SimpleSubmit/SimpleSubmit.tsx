import classNames from 'classnames';
import * as React from 'react';

import { useSimpleForm } from '../SimpleForm';

export interface SimpleSubmitProps extends Omit<React.HTMLProps<HTMLButtonElement>, 'onChange'> {
  children?: React.ReactChild;
  className?: string;
}

export default function SimpleSubmit({
  className,
  name,
  ...props
}: SimpleSubmitProps): React.ReactElement {
  const { pristine, submitting } = useSimpleForm();

  return (
    <button
      {...props}
      className={classNames('button is-primary', className, { 'is-loading': submitting })}
      disabled={pristine || submitting}
      type="submit"
    />
  );
}
