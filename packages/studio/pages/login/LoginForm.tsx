import {
  Button,
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  SSOLoginButton,
  type LoginFormValues,
  type Toggle,
  useQuery,
  useToggle,
} from '@appsemble/react-components';
import { type OrganizationLoginMethod } from '@appsemble/types';
import { emailPattern } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import { messages } from './messages.js';
import { enableRegistration, logins } from '../../utils/settings.js';

interface LoginFormProps {
  readonly allowedLoginMethods?: OrganizationLoginMethod[];
  readonly busy: Toggle;
  readonly onOrganizationSelected: (organizationId: string) => void | Promise<void>;
  readonly onPasswordLogin: (values: LoginFormValues) => Promise<void>;
  readonly organizationId?: string;
}

export function LoginForm({
  allowedLoginMethods,
  busy,
  onOrganizationSelected,
  onPasswordLogin,
  organizationId,
}: LoginFormProps): ReactNode {
  const qs = useQuery();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(
    qs.get('personal') === '1' && (!allowedLoginMethods || allowedLoginMethods.includes('password'))
      ? 'personal'
      : 'email',
  );
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; ssoName: string }[]
  >([]);
  const otherOptions = useToggle(qs.get('personal') === '1');
  const optionsId = useId();
  const choiceHeading = useRef<HTMLHeadingElement>(null);
  const passwordStep = step !== 'email';
  const allowPassword = !allowedLoginMethods || allowedLoginMethods.includes('password');
  const providers = allowedLoginMethods
    ? logins.filter((provider) =>
        allowedLoginMethods.includes(provider.name.toLowerCase() as OrganizationLoginMethod),
      )
    : logins;

  useEffect(() => {
    if (organizations.length) {
      choiceHeading.current?.focus();
    } else {
      document
        .getElementById(`${optionsId}-${step === 'password' ? 'password' : 'email'}`)
        ?.focus();
    }
  }, [optionsId, organizations, step]);

  const submit = async (values: LoginFormValues): Promise<void> => {
    if (passwordStep) {
      await onPasswordLogin(values);
      return;
    }
    setEmail(values.email);
    busy.enable();
    let data: { organizations: { id: string; name: string; ssoName: string }[] };
    try {
      ({ data } = await axios.post<typeof data>('/api/auth/email/discover', {
        email: values.email,
        organizationId,
      }));
    } finally {
      busy.disable();
    }
    if (data.organizations.length === 1) {
      await onOrganizationSelected(data.organizations[0].id);
    } else if (data.organizations.length) {
      setOrganizations(data.organizations);
    } else {
      setStep('password');
    }
  };

  const changeEmail = (): void => {
    setOrganizations([]);
    setStep('email');
  };

  return (
    <>
      {organizations.length ? (
        <>
          <h2 className="title is-4" ref={choiceHeading} tabIndex={-1}>
            <FormattedMessage {...messages.chooseOrganization} />
          </h2>
          {organizations.map((organization) => (
            <Button
              className="is-block mb-3"
              disabled={busy.enabled}
              key={organization.id}
              onClick={() => onOrganizationSelected(organization.id)}
            >
              {organization.name} ({organization.ssoName})
            </Button>
          ))}
          <Button disabled={busy.enabled} onClick={changeEmail}>
            <FormattedMessage {...messages.changeEmail} />
          </Button>
        </>
      ) : (
        <SimpleForm defaultValues={{ email, password: '' }} key={step} onSubmit={submit}>
          <SimpleFormError>
            {() => (
              <span role="alert">
                <FormattedMessage
                  {...(passwordStep ? messages.loginFailed : messages.discoveryFailed)}
                />
              </span>
            )}
          </SimpleFormError>
          <SimpleFormField
            autoComplete="username"
            disabled={busy.enabled}
            icon="envelope"
            id={`${optionsId}-email`}
            label={<FormattedMessage {...messages.emailLabel} />}
            name="email"
            onChange={(event, value: string) => setEmail(value)}
            pattern={emailPattern}
            readOnly={step === 'password'}
            required
            type="email"
            validityMessages={{
              typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
              patternMismatch: <FormattedMessage {...messages.emailInvalid} />,
              valueMissing: <FormattedMessage {...messages.emailRequired} />,
            }}
          />
          {passwordStep ? (
            <>
              <Button className="mb-4" disabled={busy.enabled} onClick={changeEmail}>
                <FormattedMessage {...messages.changeEmail} />
              </Button>
              <SimpleFormField
                autoComplete="current-password"
                component={PasswordField}
                disabled={busy.enabled}
                id={`${optionsId}-password`}
                label={<FormattedMessage {...messages.passwordLabel} />}
                name="password"
                required
                validityMessages={{
                  valueMissing: <FormattedMessage {...messages.passwordRequired} />,
                }}
              />
            </>
          ) : null}
          <FormButtons>
            <div>
              {allowPassword && enableRegistration ? (
                <Link
                  className="is-block"
                  to={{ pathname: '../register', search: location.search, hash: location.hash }}
                >
                  <FormattedMessage {...messages.registerLink} />
                </Link>
              ) : null}
              {passwordStep ? (
                <Link
                  className="is-block"
                  to={{
                    pathname: '../reset-password',
                    search: location.search,
                    hash: location.hash,
                  }}
                >
                  <FormattedMessage {...messages.forgotPasswordLink} />
                </Link>
              ) : null}
            </div>
            <SimpleSubmit disabled={busy.enabled}>
              <FormattedMessage {...(passwordStep ? messages.title : messages.continue)} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      )}
      {allowPassword || providers.length ? (
        <>
          <Button
            aria-controls={optionsId}
            aria-expanded={otherOptions.enabled}
            className="mt-4"
            disabled={busy.enabled}
            onClick={otherOptions.toggle}
          >
            <FormattedMessage {...messages.otherOptions} />
          </Button>
          <div className="mt-4" hidden={!otherOptions.enabled} id={optionsId}>
            {allowPassword && step !== 'personal' ? (
              <Button
                className="is-block mb-3"
                disabled={busy.enabled}
                onClick={() => {
                  setOrganizations([]);
                  setStep('personal');
                }}
              >
                <FormattedMessage {...messages.personalPassword} />
              </Button>
            ) : null}
            {providers.map((provider) => (
              <SSOLoginButton
                authorizationUrl={provider.authorizationUrl}
                className="mr-2"
                clientId={provider.clientId}
                disabled={busy.enabled}
                icon={provider.icon}
                key={provider.authorizationUrl}
                onClick={busy.enable}
                redirect={
                  qs.get('redirect') ||
                  (organizationId
                    ? `/organizations/${encodeURIComponent(organizationId)}`
                    : undefined)
                }
                redirectUrl="/callback"
                scope={provider.scope}
              >
                <FormattedMessage {...messages.loginWith} values={{ name: provider.name }} />
              </SSOLoginButton>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
