import {
  Button,
  Checkbox,
  Form,
  InputField,
  Loader,
  Message,
  SelectField,
  Title,
  useConfirmation,
  useData,
  useMeta,
} from '@appsemble/react-components';
import {
  ORGANIZATION_SSO_REAUTHENTICATION_REQUIRED,
  type OrganizationSsoConfiguration,
  type OrganizationSsoDomains,
  type OrganizationSsoSettings,
  PredefinedOrganizationRole,
  organizationLoginMethods,
  predefinedOrganizationRoles,
} from '@appsemble/types';
import { storageKey } from '@appsemble/web-utils';
import axios from 'axios';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { messages as roleMessages } from '../MemberRow/messages.js';

interface OperationError {
  message: string;
  requiresRecentSignIn: boolean;
}

export function SingleSignOnPage(): ReactNode {
  useMeta(messages.title);
  const { organizationId } = useParams<{ organizationId: string }>();
  const { formatMessage } = useIntl();
  const url = `/api/organizations/${organizationId}/sso`;
  const { data, error, loading, setData } = useData<OrganizationSsoSettings | null>(url);
  const {
    data: domains,
    error: domainsError,
    loading: domainsLoading,
    setData: setDomains,
  } = useData<OrganizationSsoDomains>(`${url}/domains`);
  const [domain, setDomain] = useState('');
  const [changingDomain, setChangingDomain] = useState(false);
  const [domainError, setDomainError] = useState<OperationError>();
  const [values, setValues] = useState<OrganizationSsoConfiguration>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<OperationError>();
  const requiresVerification =
    values != null &&
    (!data ||
      Boolean(values.clientSecret) ||
      (['issuer', 'clientId', 'scope', 'groupClaim'] as const).some(
        (field) => values[field] !== data[field],
      ));

  useEffect(() => {
    if (loading || error) {
      return;
    }
    if (data) {
      setValues({
        issuer: data.issuer,
        clientId: data.clientId,
        clientSecret: '',
        name: data.name,
        scope: data.scope,
        groupClaim: data.groupClaim,
        roleMappings: data.roleMappings,
        policy: data.policy,
        allowedLoginMethods: data.allowedLoginMethods,
      });
    } else {
      setValues({
        issuer: '',
        clientId: '',
        clientSecret: '',
        name: '',
        scope: 'openid email profile',
        groupClaim: 'groups',
        roleMappings: [],
        policy: 'optional',
        allowedLoginMethods: [...organizationLoginMethods],
      });
    }
  }, [data, error, loading]);

  const showError = useCallback(
    (err: unknown, setError: (error: OperationError) => void, fallback: MessageDescriptor) => {
      const response = axios.isAxiosError<{ data?: { code?: string }; message?: string }>(err)
        ? err.response
        : undefined;
      setError({
        message: response?.data?.message || formatMessage(fallback),
        requiresRecentSignIn:
          response?.data?.data?.code === ORGANIZATION_SSO_REAUTHENTICATION_REQUIRED,
      });
    },
    [formatMessage],
  );

  const signInAtProvider = useCallback(
    async (configuration?: OrganizationSsoConfiguration) => {
      try {
        const response = await axios.post<{ authorizationUrl: string }>(`${url}/login`, {
          link: true,
          configuration,
        });
        const { authorizationUrl } = response.data;
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            organizationId,
            authorizationUrl,
            state: new URL(authorizationUrl).searchParams.get('state'),
            redirect: `/organizations/${encodeURIComponent(organizationId)}/sso`,
          }),
        );
        window.location.href = authorizationUrl;
      } catch (err: unknown) {
        showError(err, setSaveError, messages.saveError);
      }
    },
    [organizationId, showError, url],
  );

  const save = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      if (!event.currentTarget.reportValidity()) {
        return;
      }
      setSaving(true);
      setSaved(false);
      setSaveError(undefined);
      const { clientSecret, ...configuration } = values;
      try {
        const proposed = {
          ...configuration,
          ...(clientSecret ? { clientSecret } : {}),
        };
        if (requiresVerification) {
          await signInAtProvider(proposed);
          return;
        }
        const response = await axios.put<OrganizationSsoSettings>(url, proposed);
        setData(response.data);
        setSaved(true);
      } catch (err: unknown) {
        showError(err, setSaveError, messages.saveError);
      } finally {
        setSaving(false);
      }
    },
    [requiresVerification, setData, showError, signInAtProvider, url, values],
  );

  const remove = useConfirmation({
    title: <FormattedMessage {...messages.remove} />,
    body: <FormattedMessage {...messages.removeBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.remove} />,
    async action() {
      try {
        await axios.delete(url);
        setData(null);
        setSaved(false);
      } catch (err: unknown) {
        showError(err, setSaveError, messages.saveError);
      }
    },
  });

  const updateDomain = useCallback(
    async (action: 'add' | 'remove', value: string) => {
      setChangingDomain(true);
      setDomainError(undefined);
      try {
        if (action === 'add') {
          const response = await axios.post<OrganizationSsoDomains>(`${url}/domains`, {
            domain: value,
          });
          setDomains(response.data);
          setDomain('');
        } else {
          await axios.delete(`${url}/domains/${encodeURIComponent(value)}`);
          setDomains((current) => ({
            ...current,
            domains: current.domains.filter((entry) => entry !== value),
          }));
        }
      } catch (err: unknown) {
        showError(err, setDomainError, messages.domainError);
      } finally {
        setChangingDomain(false);
      }
    },
    [setDomains, showError, url],
  );

  if (loading || (!values && !error)) {
    return <Loader />;
  }
  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.loadError} />
      </Message>
    );
  }

  const managed = data?.managedBy === 'deployment';
  const signInAgain = data ? (
    <div className="mt-3">
      <Button color="primary" onClick={() => signInAtProvider()}>
        <FormattedMessage {...messages.signInAgain} values={{ name: data.name }} />
      </Button>
    </div>
  ) : null;

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      {managed ? (
        <Message color="info">
          <FormattedMessage {...messages.managed} />
        </Message>
      ) : null}
      {saveError ? (
        <Message color="danger">
          {saveError.message}
          {saveError.requiresRecentSignIn ? signInAgain : null}
        </Message>
      ) : null}
      {saved ? (
        <Message color="success">
          <FormattedMessage {...messages.saved} />
        </Message>
      ) : null}
      <Form onSubmit={save}>
        <fieldset disabled={managed || saving}>
          <InputField
            label={<FormattedMessage {...messages.name} />}
            name="name"
            onChange={(event) => setValues({ ...values, name: event.currentTarget.value })}
            required
            value={values.name}
          />
          <InputField
            label={<FormattedMessage {...messages.issuer} />}
            name="issuer"
            onChange={(event) => setValues({ ...values, issuer: event.currentTarget.value })}
            required
            type="url"
            value={values.issuer}
          />
          <InputField
            label={<FormattedMessage {...messages.clientId} />}
            name="clientId"
            onChange={(event) => setValues({ ...values, clientId: event.currentTarget.value })}
            required
            value={values.clientId}
          />
          <InputField
            autoComplete="new-password"
            help={data?.hasClientSecret ? <FormattedMessage {...messages.keepSecret} /> : undefined}
            label={<FormattedMessage {...messages.clientSecret} />}
            name="clientSecret"
            onChange={(event) => setValues({ ...values, clientSecret: event.currentTarget.value })}
            required={!data?.hasClientSecret}
            type="password"
            value={values.clientSecret}
          />
          <InputField
            label={<FormattedMessage {...messages.scope} />}
            name="scope"
            onChange={(event) => setValues({ ...values, scope: event.currentTarget.value })}
            required
            value={values.scope}
          />
          <InputField
            label={<FormattedMessage {...messages.groupClaim} />}
            name="groupClaim"
            onChange={(event) => setValues({ ...values, groupClaim: event.currentTarget.value })}
            required
            value={values.groupClaim}
          />
          <SelectField
            label={<FormattedMessage {...messages.policy} />}
            name="policy"
            onChange={(event, policy: OrganizationSsoConfiguration['policy']) =>
              setValues({
                ...values,
                policy,
                ...(policy === 'required' ? { allowedLoginMethods: ['oidc'] } : {}),
              })
            }
            required
            value={values.policy}
          >
            <option value="optional">{formatMessage(messages.optional)}</option>
            <option value="required">{formatMessage(messages.required)}</option>
            <option value="required-with-guests">{formatMessage(messages.requiredGuests)}</option>
          </SelectField>
          {values.policy === 'required' ? null : (
            <fieldset className="mb-4">
              <legend>
                <FormattedMessage {...messages.methods} />
              </legend>
              {organizationLoginMethods
                .filter((method) => method !== 'oidc')
                .map((method) => (
                  <Checkbox
                    className="mr-4"
                    key={method}
                    label={formatMessage(messages[method])}
                    name={`method-${method}`}
                    onChange={(event, enabled) =>
                      setValues({
                        ...values,
                        allowedLoginMethods: enabled
                          ? [...values.allowedLoginMethods, method]
                          : values.allowedLoginMethods.filter((value) => value !== method),
                      })
                    }
                    value={values.allowedLoginMethods.includes(method)}
                  />
                ))}
            </fieldset>
          )}
          <Title level={4}>
            <FormattedMessage {...messages.mappings} />
          </Title>
          <p className="mb-3">
            <FormattedMessage {...messages.mappingHelp} />
          </p>
          {values.roleMappings.map((mapping, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <fieldset className="box" key={index}>
              <legend>
                <FormattedMessage {...messages.mapping} values={{ number: index + 1 }} />
              </legend>
              <InputField
                label={<FormattedMessage {...messages.group} />}
                name={`group-${index}`}
                onChange={(event) =>
                  setValues({
                    ...values,
                    roleMappings: values.roleMappings.map((entry, i) =>
                      i === index ? { ...entry, group: event.currentTarget.value } : entry,
                    ),
                  })
                }
                required
                value={mapping.group}
              />
              <SelectField
                label={<FormattedMessage {...messages.role} />}
                name={`role-${index}`}
                onChange={(event, role: PredefinedOrganizationRole) =>
                  setValues({
                    ...values,
                    roleMappings: values.roleMappings.map((entry, i) =>
                      i === index ? { ...entry, role } : entry,
                    ),
                  })
                }
                required
                value={mapping.role}
              >
                {predefinedOrganizationRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatMessage(roleMessages[role])}
                  </option>
                ))}
              </SelectField>
              <Button
                color="danger"
                onClick={() =>
                  setValues({
                    ...values,
                    roleMappings: values.roleMappings.filter((entry) => entry !== mapping),
                  })
                }
              >
                <FormattedMessage {...messages.removeMapping} values={{ number: index + 1 }} />
              </Button>
            </fieldset>
          ))}
          <Button
            className="mb-4 mr-3"
            onClick={() =>
              setValues({
                ...values,
                roleMappings: [
                  ...values.roleMappings,
                  { group: '', role: PredefinedOrganizationRole.Member },
                ],
              })
            }
          >
            <FormattedMessage {...messages.addMapping} />
          </Button>
          {managed ? null : (
            <>
              {requiresVerification ? (
                <p className="mb-3">
                  <FormattedMessage {...messages.verifyHelp} />
                </p>
              ) : null}
              <Button color="primary" loading={saving} type="submit">
                <FormattedMessage {...(requiresVerification ? messages.verify : messages.save)} />
              </Button>
            </>
          )}
        </fieldset>
      </Form>
      {data ? (
        <Button
          className="mt-4 mr-3"
          component={Link}
          to={`/login?${new URLSearchParams({ organization: organizationId, redirect: `/organizations/${encodeURIComponent(organizationId)}/sso` })}`}
        >
          <FormattedMessage {...messages.configureLogin} />
        </Button>
      ) : null}
      {data && !managed ? (
        <Button className="mt-4" color="danger" onClick={remove}>
          <FormattedMessage {...messages.remove} />
        </Button>
      ) : null}
      {data ? (
        <section className="mt-5">
          <Title level={2} size={4}>
            <FormattedMessage {...messages.domains} />
          </Title>
          {domainsError || domainError ? (
            <Message color="danger">
              <span role="alert">
                {domainError?.message || <FormattedMessage {...messages.domainError} />}
              </span>
              {domainError?.requiresRecentSignIn ? signInAgain : null}
            </Message>
          ) : null}
          {domainsLoading ? (
            <Loader />
          ) : domainsError ? null : (
            <>
              <ul>
                {domains.domains.map((value) => (
                  <li className="box" key={value}>
                    <strong>{value}</strong>
                    {managed ? (
                      <p>
                        <FormattedMessage {...messages.domainManaged} />
                      </p>
                    ) : (
                      <Button
                        className="ml-3"
                        color="danger"
                        disabled={changingDomain}
                        onClick={() => updateDomain('remove', value)}
                      >
                        <FormattedMessage {...messages.removeDomain} values={{ domain: value }} />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {managed ? null : (
                <Form
                  onSubmit={(event) => {
                    if (event.currentTarget.reportValidity()) {
                      updateDomain('add', domain);
                    }
                  }}
                >
                  <p className="mb-3">
                    <FormattedMessage
                      {...messages.domainHelp}
                      values={{
                        name: (
                          <code className={styles.record}>
                            _appsemble-sso.{domain || 'example.com'}
                          </code>
                        ),
                        value: <code className={styles.record}>{domains.recordValue}</code>,
                      }}
                    />
                  </p>
                  <InputField
                    disabled={changingDomain}
                    label={<FormattedMessage {...messages.domain} />}
                    name="domain"
                    onChange={(event) => setDomain(event.currentTarget.value)}
                    required
                    value={domain}
                  />
                  <Button color="primary" loading={changingDomain} type="submit">
                    <FormattedMessage {...messages.verifyAndAddDomain} />
                  </Button>
                </Form>
              )}
            </>
          )}
        </section>
      ) : null}
    </>
  );
}
