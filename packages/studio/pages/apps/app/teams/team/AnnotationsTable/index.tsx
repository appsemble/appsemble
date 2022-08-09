import { Input, Table, useSimpleForm } from '@appsemble/react-components';
import { ChangeEvent, forwardRef, ReactElement, ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface AnnotationsTableProps {
  disabled?: boolean;
  error?: ReactNode;
  name?: string;
  value?: [string, string][];
  onChange?: (event: any, value: [string, string][]) => void;
  children?: ReactNode;
}

export const AnnotationsTable = forwardRef<never, AnnotationsTableProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ disabled, name, onChange, value }, ref): ReactElement => {
    const { setFormError } = useSimpleForm();

    const setValue = useCallback(
      (newValue: typeof value) => {
        onChange(null, newValue);
        const keys = newValue.map(([k]) => k);
        const duplicate = !keys.every((k, i) => keys.indexOf(k) === i);
        setFormError(name, newValue.find((v) => !v[0] || !v[1]) || duplicate);
      },
      [name, onChange, setFormError],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>, val: string) => {
        const [type, index] = event.currentTarget.id.split('-');
        const i = Number(index);
        const copy = [...value];
        copy[i] = type === 'key' ? [val, copy[i]?.[1] ?? ''] : [copy[i]?.[0] ?? '', val];
        setValue(copy);
      },
      [setValue, value],
    );

    const handleBlur = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const [, index] = event.currentTarget.id.split('-');

        const i = Number(index);
        if (i >= value.length) {
          return;
        }

        if (!value[i][0] && !value[i][1]) {
          setValue([...value.slice(0, i), ...value.slice(i + 1)]);
        }
      },
      [setValue, value],
    );

    const keys = value.map((v) => v[0]);

    return (
      <Table>
        <thead>
          <tr>
            <th>
              <FormattedMessage {...messages.key} />
            </th>
            <th>
              <FormattedMessage {...messages.value} />
            </th>
          </tr>
        </thead>
        <tbody>
          {[...value, ['', '']].map(([key, val], index) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={index}>
              <td>
                <Input
                  disabled={disabled}
                  error={key ? keys.indexOf(key) !== index : index < value.length}
                  id={`key-${index}`}
                  name="key"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={key}
                />
              </td>
              <td>
                <Input
                  disabled={disabled}
                  error={index < value.length && !val}
                  id={`value-${index}`}
                  name="value"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={val}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  },
);
