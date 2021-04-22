import { Checkbox, useToggle } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';

interface ClonableCheckboxProps {
  checked: boolean;
  id: string;
  onChange: () => Promise<void>;
}

export function ClonableCheckbox({ checked, id, onChange }: ClonableCheckboxProps): ReactElement {
  const { disable, enable, enabled } = useToggle();
  const handleChange = useCallback(async () => {
    enable();
    await onChange();
    disable();
  }, [onChange, enable, disable]);

  return <Checkbox disabled={enabled} name={id} onChange={handleChange} value={checked} />;
}
