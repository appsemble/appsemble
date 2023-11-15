import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
  useState,
} from 'react';

import { Checkbox } from '../index.js';

interface AsyncCheckboxProps extends ComponentPropsWithoutRef<typeof Checkbox> {
  /**
   * This is fired when the input value has changed.
   */
  readonly onChange: (event: ChangeEvent<HTMLInputElement>, value: boolean) => Promise<void>;
}

/**
 * A checkbox which is disabled while an asynchronous `onChange` event is being run.
 */
export function AsyncCheckbox({ disabled, onChange, ...props }: AsyncCheckboxProps): ReactNode {
  const [busy, setBusy] = useState(false);

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, value: boolean) => {
      setBusy(true);
      try {
        await onChange(event, value);
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  return <Checkbox disabled={busy || disabled} onChange={handleChange} {...props} />;
}
