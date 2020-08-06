import { useBeforeUnload } from '..';
import { useSimpleForm } from '../SimpleForm';

export default function SimpleBeforeUnload(): null {
  const { pristine, submitting } = useSimpleForm();

  useBeforeUnload(submitting || !pristine);

  return null;
}
