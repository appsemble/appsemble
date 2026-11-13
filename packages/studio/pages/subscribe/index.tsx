import {
  Button,
  Content,
  Loader,
  Message,
  SelectField,
  Title,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import {
  getSubscriptionPlanByName,
  type OrganizationSubscription,
  OrganizationPermission,
  SubscriptionPlanType,
} from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { CreateOrganizationModal } from '../../components/CreateOrganizationModal/index.js';
import { useUser } from '../../components/UserProvider/index.js';

/**
 * Let the user pick an organization to activate a subscription plan for.
 */
export function SubscribePage(): ReactNode {
  const { lang, subscriptionPlanName } = useParams<{
    lang: string;
    subscriptionPlanName: string;
  }>();
  const { organizations, userInfo } = useUser();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const modal = useToggle();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [currentPlans, setCurrentPlans] = useState<Record<string, SubscriptionPlanType>>();
  const [currentPlansError, setCurrentPlansError] = useState(false);

  useMeta(messages.title);

  const planExists =
    subscriptionPlanName !== SubscriptionPlanType.Free &&
    Object.values(SubscriptionPlanType).includes(subscriptionPlanName as SubscriptionPlanType);

  const manageableOrganizations = useMemo(
    () =>
      organizations.filter((organization) =>
        checkOrganizationRoleOrganizationPermissions(organization.role, [
          OrganizationPermission.ManageOrganizationSubscriptions,
        ]),
      ),
    [organizations],
  );

  useEffect(() => {
    if (!planExists) {
      return;
    }
    Promise.all(
      manageableOrganizations.map(({ id }) =>
        axios.get<OrganizationSubscription>(`/api/organizations/${id}/subscription`),
      ),
    ).then(
      (responses) => {
        setCurrentPlans(
          Object.fromEntries(
            responses.map(({ data }) => [data.organizationId, data.subscriptionPlan]),
          ),
        );
      },
      () => setCurrentPlansError(true),
    );
  }, [manageableOrganizations, planExists]);

  if (!planExists) {
    return (
      <Content main>
        <Message color="danger">
          <p>
            <FormattedMessage {...messages.notFound} />
          </p>
          <Link to={`/${lang}/apps`}>
            <FormattedMessage {...messages.home} />
          </Link>
        </Message>
      </Content>
    );
  }

  const subscriptionPlan = getSubscriptionPlanByName(subscriptionPlanName);
  const activate = (organizationId: string): void => {
    navigate(
      `/${lang}/organizations/${organizationId}/subscriptions/activate/${subscriptionPlanName}`,
    );
  };

  if (currentPlansError) {
    return (
      <Content main>
        <Message color="danger">
          <FormattedMessage {...messages.currentPlansError} />
        </Message>
      </Content>
    );
  }

  if (!currentPlans) {
    return <Loader />;
  }

  const eligibleOrganizations = manageableOrganizations.filter(
    ({ id }) => currentPlans[id] !== subscriptionPlanName,
  );
  const organizationId =
    selectedOrganizationId ||
    (eligibleOrganizations.length === 1 ? eligibleOrganizations[0].id : '');

  return (
    <Content main>
      <Title>{subscriptionPlan.name.toUpperCase()}</Title>
      <p className="subtitle">
        <FormattedMessage {...messages.price} values={{ price: subscriptionPlan.price }} />
      </p>
      {manageableOrganizations.length ? (
        <SelectField
          label={<FormattedMessage {...messages.organization} />}
          name="organization"
          onChange={(event, value) => setSelectedOrganizationId(value as string)}
          required
          value={organizationId}
        >
          <option disabled value="">
            {formatMessage(messages.selectOrganization)}
          </option>
          {manageableOrganizations.map((organization) => (
            <option
              disabled={!eligibleOrganizations.includes(organization)}
              key={organization.id}
              value={organization.id}
            >
              {eligibleOrganizations.includes(organization)
                ? organization.name || organization.id
                : formatMessage(messages.currentPlan, {
                    organization: organization.name || organization.id,
                  })}
            </option>
          ))}
        </SelectField>
      ) : (
        <p>
          <FormattedMessage {...messages.noOrganizations} />
        </p>
      )}
      <div className="buttons">
        {manageableOrganizations.length ? (
          <Button
            className="is-primary"
            disabled={!organizationId}
            onClick={() => activate(organizationId)}
          >
            <FormattedMessage {...messages.continue} />
          </Button>
        ) : null}
        <Button disabled={!userInfo.email_verified} onClick={modal.enable}>
          <FormattedMessage {...messages.createOrganization} />
        </Button>
      </div>
      {userInfo.email_verified ? null : (
        <p className="help">
          <FormattedMessage {...messages.createVerify} />
        </p>
      )}
      <CreateOrganizationModal
        isActive={modal.enabled}
        onClose={modal.disable}
        onCreateOrganization={({ id }) => activate(id)}
        title={<FormattedMessage {...messages.createTitle} />}
      />
    </Content>
  );
}
