import { FormComponent } from '@appsemble/react-components';
import React, { ComponentPropsWithoutRef, forwardRef, ReactElement } from 'react';

import StarRating from '../StarRating';

type RatingFieldProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  ComponentPropsWithoutRef<typeof StarRating>;

/**
 * A star rating component wrapped in a form field.
 *
 * This makes the star rating compatible with our form layouts.
 */
export default forwardRef<any, RatingFieldProps>(
  ({ count, name, onChange, value, ...props }, _ref): ReactElement => (
    <FormComponent id={name} {...props}>
      <StarRating name={name} onChange={onChange} value={value} />
    </FormComponent>
  ),
);
