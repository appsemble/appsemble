import {
  FormButtons,
  type MinimalHTMLElement,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import { type Organization, type SubscriptionPlan } from '@appsemble/types';
import axios from 'axios';
import countries from 'i18n-iso-countries';
import { type ChangeEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { emailPattern } from '@appsemble/utils';

interface BillingInformationBoxProps {
  /**
   * The subscription plan that user is trying to buy.
   */
  readonly subscriptionPlan: SubscriptionPlan;

  /**
   * The organization we want to associate with the subscription.
   */
  readonly organization: Organization;

  /**
   * The function to advance to next step.
   */
  readonly nextStep: () => void;

  /**
   * Change handler used to update the organization for the parent component.
   */
  readonly onChangeOrganization: (organization: Organization) => void;
}

export function BillingInformationBox({
  nextStep,
  onChangeOrganization,
  organization,
}: BillingInformationBoxProps): ReactNode {
  const countryNames = countries.getNames('en');
  const [country, setCountry] = useState<string>(organization.countryCode || '');
  const { setOrganizations, userInfo } = useUser();
  const defaultValues = useMemo(
    () => ({
      email: organization.email || userInfo.email || '',
      vatIdNumber: organization.vatIdNumber || '',
      invoiceReference: organization.invoiceReference || '',
      streetName: organization.streetName || '',
      houseNumber: organization.houseNumber || '',
      city: organization.city || '',
      zipCode: organization.zipCode || '',
      countryCode: organization.countryCode || '',
      name: organization.name || organization.id || '',
    }),
    [organization, userInfo.email],
  );

  const changeCountry = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>) => {
      setCountry(event.target.value);
    },
    [setCountry],
  );

  const onEditOrganization = useCallback(
    async ({
      city,
      countryCode,
      email,
      houseNumber,
      invoiceReference,
      name,
      streetName,
      vatIdNumber,
      zipCode,
    }: typeof defaultValues) => {
      const formData = new FormData();
      formData.set('email', email);
      if (country === 'NL') {
        formData.set('vatIdNumber', '');
      } else {
        formData.set('vatIdNumber', vatIdNumber);
      }
      formData.set('invoiceReference', invoiceReference);
      formData.set('streetName', streetName);
      formData.set('houseNumber', houseNumber);
      formData.set('city', city);
      formData.set('zipCode', zipCode);
      formData.set('countryCode', countryCode);
      formData.set('name', name);

      if (
        !(JSON.stringify(Object.fromEntries(formData.entries())) === JSON.stringify(defaultValues))
      ) {
        await axios.patch(`/api/organizations/${organization.id}`, formData);
        setOrganizations((organizations) =>
          organizations.map((org) =>
            org.id === organization.id
              ? {
                  ...org,
                  email,
                  vatIdNumber,
                  streetName,
                  houseNumber,
                  city,
                  zipCode,
                  countryCode,
                  name,
                  invoiceReference,
                }
              : org,
          ),
        );
        onChangeOrganization({
          ...organization,
          email,
          vatIdNumber,
          invoiceReference,
          streetName,
          houseNumber,
          city,
          zipCode,
          countryCode,
          name,
        });
      }
      nextStep();
    },
    [defaultValues, nextStep, organization, setOrganizations, onChangeOrganization, country],
  );

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={onEditOrganization}>
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionName} />}
        label={<FormattedMessage {...messages.name} />}
        maxLength={20}
        name="name"
        required
      />
      <SimpleFormField
        component={SelectField}
        help={<FormattedMessage {...messages.descriptionCountry} />}
        label={<FormattedMessage {...messages.country} />}
        name="countryCode"
        onChange={changeCountry}
        required
      >
        <option value="">
          <FormattedMessage {...messages.selectCountry} />
        </option>
        {Object.entries(countryNames).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </SimpleFormField>
      {country === 'NL' ? null : (
        <SimpleFormField
          help={<FormattedMessage {...messages.descriptionVatIdNumber} />}
          label={<FormattedMessage {...messages.vatIdNumber} />}
          maxLength={20}
          name="vatIdNumber"
        />
      )}
      <SimpleFormField
        help={<FormattedMessage {...messages.emailDescription} />}
        label={<FormattedMessage {...messages.email} />}
        name="email"
        pattern={emailPattern}
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          patternMismatch: <FormattedMessage {...messages.emailInvalid} />,
        }}
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionStreetName} />}
        label={<FormattedMessage {...messages.streetName} />}
        maxLength={20}
        name="streetName"
        required
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionHouseNumber} />}
        label={<FormattedMessage {...messages.houseNumber} />}
        maxLength={20}
        name="houseNumber"
        required
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionCity} />}
        label={<FormattedMessage {...messages.city} />}
        maxLength={20}
        name="city"
        required
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionZipCode} />}
        label={<FormattedMessage {...messages.zipCode} />}
        maxLength={20}
        name="zipCode"
        required
      />
      <SimpleFormField
        help={<FormattedMessage {...messages.descriptionInvoiceReference} />}
        label={<FormattedMessage {...messages.invoiceReference} />}
        maxLength={100}
        name="invoiceReference"
      />
      <FormButtons>
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
