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
  type OrganizationSsoConfiguration,
  type OrganizationSsoDomain,
  type OrganizationSsoSettings,
  PredefinedOrganizationRole,
  organizationLoginMethods,
  predefinedOrganizationRoles,
} from '@appsemble/types';
import { storageKey } from '@appsemble/web-utils';
import axios from 'axios';
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { messages as roleMessages } from '../MemberRow/messages.js';

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
  } = useData<OrganizationSsoDomain[]>(`${url}/domains`);
  const [domain, setDomain] = useState('');
  const [changingDomain, setChangingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string>();
  const [values, setValues] = useState<OrganizationSsoConfiguration>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>();
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
          const response = await axios.post<{ authorizationUrl: string }>(`${url}/login`, {
            link: true,
            configuration: proposed,
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
          return;
        }
        const response = await axios.put<OrganizationSsoSettings>(url, proposed);
        setData(response.data);
        setSaved(true);
      } catch (err: unknown) {
        setSaveError(
          axios.isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : formatMessage(messages.saveError),
        );
      } finally {
        setSaving(false);
      }
    },
    [formatMessage, organizationId, requiresVerification, setData, url, values],
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
        setSaveError(
          axios.isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : formatMessage(messages.saveError),
        );
      }
    },
  });

  const updateDomain = useCallback(
    async (action: 'add' | 'verify' | 'remove', value: string) => {
      setChangingDomain(true);
      setDomainError(undefined);
      const domainUrl = `${url}/domains/${encodeURIComponent(value)}`;
      try {
        const response = await axios<OrganizationSsoDomain>({
          method: action === 'remove' ? 'delete' : 'post',
          url:
            action === 'add'
              ? `${url}/domains`
              : `${domainUrl}${action === 'verify' ? '/verify' : ''}`,
          ...(action === 'add' ? { data: { domain: value } } : {}),
        });
        setDomains((current) =>
          action === 'remove'
            ? current.filter((claim) => claim.domain !== value)
            : [...current.filter((claim) => claim.domain !== response.data.domain), response.data],
        );
        if (action === 'add') {
          setDomain('');
        }
      } catch (err: unknown) {
        setDomainError(
          axios.isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : formatMessage(messages.domainError),
        );
      } finally {
        setChangingDomain(false);
      }
    },
    [formatMessage, setDomains, url],
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
      {saveError ? <Message color="danger">{saveError}</Message> : null}
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
          <p className="mb-3">
            <FormattedMessage {...messages.domainHelp} />
          </p>
          {domainsError || domainError ? (
            <Message color="danger">
              <span role="alert">
                {domainError || <FormattedMessage {...messages.domainError} />}
              </span>
            </Message>
          ) : null}
          {domainsLoading ? (
            <Loader />
          ) : domainsError ? null : (
            <>
              <ul>
                {domains.map((claim) => (
                  <li className="box" key={claim.domain}>
                    <strong>{claim.domain}</strong>
                    <p>
                      <FormattedMessage
                        {...(claim.managedBy === 'deployment'
                          ? messages.domainManaged
                          : claim.verified
                            ? messages.domainVerified
                            : messages.domainPending)}
                      />
                    </p>
                    {claim.verified ? null : (
                      <>
                        <p>
                          <FormattedMessage {...messages.recordName} />:{' '}
                          <code className={styles.record}>{claim.recordName}</code>
                        </p>
                        <p>
                          <FormattedMessage {...messages.recordValue} />:{' '}
                          <code className={styles.record}>{claim.recordValue}</code>
                        </p>
                        <Button
                          className="mt-3 mr-3"
                          disabled={managed || changingDomain}
                          onClick={() => updateDomain('verify', claim.domain)}
                        >
                          <FormattedMessage
                            {...messages.verifyDomain}
                            values={{ domain: claim.domain }}
                          />
                        </Button>
                      </>
                    )}
                    {claim.managedBy === 'studio' ? (
                      <Button
                        className="mt-3"
                        color="danger"
                        disabled={managed || changingDomain}
                        onClick={() => updateDomain('remove', claim.domain)}
                      >
                        <FormattedMessage
                          {...messages.removeDomain}
                          values={{ domain: claim.domain }}
                        />
                      </Button>
                    ) : null}
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
                  <InputField
                    disabled={changingDomain}
                    label={<FormattedMessage {...messages.domain} />}
                    name="domain"
                    onChange={(event) => setDomain(event.currentTarget.value)}
                    required
                    value={domain}
                  />
                  <Button color="primary" loading={changingDomain} type="submit">
                    <FormattedMessage {...messages.addDomain} />
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
