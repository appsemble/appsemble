import {
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  SimpleSubmit,
  type Toggle,
  useToggle,
} from '@appsemble/react-components';
import { type ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface DemoLoginProps {
  readonly modal?: Toggle;
}

export function DemoLogin({ modal }: DemoLoginProps): ReactElement {
  const busy = useToggle();

  const { definition } = useAppDefinition();
  const roles = Object.keys(definition?.security?.roles ?? {});
  const { demoLogin } = useUser();

  const defaultValues = useMemo(
    () => ({
      role: roles[0] ?? '',
    }),
    [roles],
  );
  const handleLogin = useCallback(
    async ({ role }: typeof defaultValues) => {
      busy.enable();
      try {
        await demoLogin(role);
        busy.disable();
      } catch (error) {
        busy.disable();
        throw error;
      }
    },
    [busy, demoLogin],
  );

  const fields = (
    <SimpleFormField
      component={SelectField}
      disabled={roles.length === 1 || busy.enabled}
      label={<FormattedMessage {...messages.selectRole} />}
      name="role"
      required
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </SimpleFormField>
  );

  if (modal) {
    return (
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        footer={
          <SimpleModalFooter
            allowPristine={false}
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={modal.disable}
            submitLabel={<FormattedMessage {...messages.login} />}
          />
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={handleLogin}
      >
        <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
        {fields}
      </ModalCard>
    );
  }

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={handleLogin}>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      {fields}
      <SimpleSubmit allowPristine={false} disabled={busy.enabled}>
        <FormattedMessage {...messages.login} />
      </SimpleSubmit>
    </SimpleForm>
  );
}
