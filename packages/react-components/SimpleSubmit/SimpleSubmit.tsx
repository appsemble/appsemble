import classNames from 'classnames';
import * as React from 'react';

import { useSimpleForm } from '../SimpleForm';

export interface SimpleSubmitProps extends Omit<React.HTMLProps<HTMLButtonElement>, 'onChange'> {
  children?: React.ReactChild;
  className?: string;
}

export default function SimpleSubmit({
  className,
  disabled,
  name,
  ...props
}: SimpleSubmitProps): React.ReactElement {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <button
      {...props}
      className={classNames('button is-primary', className, { 'is-loading': submitting })}
      disabled={disabled || pristine || submitting || Object.values(formErrors).some(Boolean)}
      type="submit"
    />
  );
}
