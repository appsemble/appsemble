import { useBeforeUnload, useSimpleForm } from '..';

export function SimpleBeforeUnload(): null {
  const { pristine, submitting } = useSimpleForm();

  useBeforeUnload(submitting || !pristine);

  return null;
}
