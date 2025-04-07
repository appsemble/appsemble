import { getAppRoles } from '@appsemble/lang-sdk';
import {
  type MinimalHTMLElement,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  type Toggle,
  useToggle,
} from '@appsemble/react-components';
import { type AppMemberInfo, type AppRole } from '@appsemble/types';
import { type ChangeEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useDemoAppMembers } from '../DemoAppMembersProvider/index.js';

interface DemoLoginProps {
  readonly modal?: Toggle;
}

export function DemoLogin({ modal }: DemoLoginProps): ReactNode {
  const { demoLogin } = useAppMember();
  const { definition: appDefinition } = useAppDefinition();
  const { getAppMessage } = useAppMessages();
  const { demoAppMembers, refetchDemoAppMembers } = useDemoAppMembers();

  const busy = useToggle();

  const appRoles = getAppRoles(appDefinition.security);
  const defaultAppRole = useMemo(
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    () => appDefinition?.security?.default.role ?? appRoles[0] ?? '',
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    [appDefinition?.security?.default.role, appRoles],
  );

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const [selectedDemoAppMember, setSelectedDemoAppMember] = useState<AppMemberInfo>(null);
  const [selectedAppRole, setSelectedAppRole] = useState<string>(defaultAppRole);

  const [operation, setOperation] = useState<'create-account' | 'login'>(
    demoAppMembers.length ? 'login' : 'create-account',
  );

  const demoAppMember = useMemo(
    () => selectedDemoAppMember ?? demoAppMembers[0],
    [demoAppMembers, selectedDemoAppMember],
  );

  const getRoleDescription = (role: AppRole): string =>
    getAppMessage({
      id: `app.roles.${role}.description`,
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      defaultMessage: appDefinition.security?.roles[role]?.description || role,
    }).format() as string;

  const selectedDemoAppMemberRoleDescription = getRoleDescription(demoAppMember?.role);

  const selectedAppRoleDescription = getRoleDescription(selectedAppRole);

  const changeDemoAppMember = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedDemoAppMember(
      demoAppMembers.find((appMember) => appMember.sub === event.target.value) ?? demoAppMembers[0],
    );
  };

  const changeAppRole = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setSelectedAppRole(event.target.value);
  };

  const setLogin = (): void => {
    setOperation('login');
  };

  const setCreateAccount = (): void => {
    setOperation('create-account');
  };

  const defaultValues = useMemo(
    () => ({
      appMemberId: demoAppMember?.sub ?? undefined,
      appRole: defaultAppRole ?? undefined,
    }),
    [defaultAppRole, demoAppMember?.sub],
  );

  const handleLogin = useCallback(async () => {
    busy.enable();
    try {
      await demoLogin({
        appMemberId: operation === 'login' ? demoAppMember.sub : '',
        appRole: operation === 'create-account' ? selectedAppRole : '',
      });
      busy.disable();
      if (modal) {
        modal.disable();
        window.location.reload();
      }
      await refetchDemoAppMembers();
    } catch (error) {
      busy.disable();
      throw error;
    }
  }, [busy, demoLogin, operation, demoAppMember, selectedAppRole, modal, refetchDemoAppMembers]);

  const fields = (
    <>
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      {demoAppMembers.length ? (
        <div className="mb-6">
          <SimpleFormField
            component={SelectField}
            disabled={demoAppMembers.length < 2 || busy.enabled}
            help={<div className={styles.black}>{selectedDemoAppMemberRoleDescription}</div>}
            label={<FormattedMessage {...messages.selectMember} />}
            name="appMemberId"
            onChange={changeDemoAppMember}
            required
          >
            {demoAppMembers.map((appMember) => (
              <option key={appMember.sub} value={appMember.sub}>
                {appMember.name}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit
            allowPristine={false}
            dataTestId="login"
            disabled={busy.enabled}
            onClick={setLogin}
          >
            <FormattedMessage {...messages.login} />
          </SimpleSubmit>
        </div>
      ) : null}
      {appRoles.length ? (
        <>
          <SimpleFormField
            component={SelectField}
            data-testid="app-role"
            disabled={appRoles.length < 2 || busy.enabled}
            help={
              selectedAppRoleDescription === selectedAppRole ? null : (
                <div className={styles.black}>{selectedAppRoleDescription}</div>
              )
            }
            label={<FormattedMessage {...messages.selectRole} />}
            name="appRole"
            onChange={changeAppRole}
            required
          >
            {appRoles.map((appRole) => (
              <option key={appRole} value={appRole}>
                {getAppMessage({
                  id: `app.roles.${appRole}`,
                  defaultMessage: appRole,
                }).format()}
              </option>
            ))}
          </SimpleFormField>
          <SimpleSubmit
            allowPristine={false}
            dataTestId="create-account"
            disabled={busy.enabled}
            onClick={setCreateAccount}
          >
            <FormattedMessage {...messages.createAccount} />
          </SimpleSubmit>
        </>
      ) : null}
    </>
  );

  if (modal) {
    return (
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultValues}
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={handleLogin}
      >
        {fields}
      </ModalCard>
    );
  }

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={handleLogin}>
      {fields}
    </SimpleForm>
  );
}
