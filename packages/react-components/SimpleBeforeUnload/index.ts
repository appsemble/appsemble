import { useBeforeUnload, useSimpleForm } from '..';

export function SimpleBeforeUnload(): null {
  const { pristine, submitting } = useSimpleForm();

  useBeforeUnload(submitting || !Object.values(pristine).every(Boolean));

  return null;
}
