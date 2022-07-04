import { FormComponent } from '@appsemble/react-components';
import { ComponentPropsWithoutRef, forwardRef, ReactElement } from 'react';

import { StarRating } from '../StarRating';

type RatingFieldProps = ComponentPropsWithoutRef<typeof StarRating> &
  Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'>;

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
