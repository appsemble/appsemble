import { useBeforeUnload, useSimpleForm } from '../index.js';

export function SimpleBeforeUnload(): null {
  const { pristine, submitting } = useSimpleForm();

  useBeforeUnload(submitting || !Object.values(pristine).every(Boolean));

  return null;
}
