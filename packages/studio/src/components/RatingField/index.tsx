import { FormComponent } from '@appsemble/react-components';
import React, { ComponentPropsWithoutRef, forwardRef, ReactElement } from 'react';

import { StarRating } from '../StarRating';

type RatingFieldProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  ComponentPropsWithoutRef<typeof StarRating>;

/**
 * A star rating component wrapped in a form field.
 *
 * This makes the star rating compatible with our form layouts.
 */
export const RatingField = forwardRef<never, RatingFieldProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ count, name, onChange, value, ...props }, ref): ReactElement => (
    <FormComponent id={name} {...props}>
      <StarRating count={count} name={name} onChange={onChange} value={value} />
    </FormComponent>
  ),
);
