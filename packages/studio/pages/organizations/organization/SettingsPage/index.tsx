import {
  Button,
  Content,
  FileUpload,
  Input,
  Message,
  type MinimalHTMLElement,
  Select,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useConfirmation,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type App, type AppCollection } from '@appsemble/types';
import axios from 'axios';
import countries from 'i18n-iso-countries';
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { Collapsible } from '../../../../components/Collapsible/index.js';
import { IconPreview } from '../../../../components/IconPreview/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type Block, type Organization } from '../../../../types.js';
import { supportedOrganizationLanguages } from '../../../../utils/constants.js';
import { emailPattern } from '@appsemble/utils';

interface SettingsPageProps {
  /**
   * The organization the settings belong to.
   */
  readonly organization: Organization;

  /**
   * Change handler used to update the organization for the parent component.
   */
  readonly onChangeOrganization: (organization: Organization) => void;
}

/**
 * Strip a website link protocol.
 *
 * @param link The website link to strip the protocol from.
 * @returns The website link without protocol.
 */
function preprocessWebsite(link: string): string {
  return link.replace(/^https?:\/\//, '');
}

/**
 * The page for configuring various settings of an organization.
 */
export function SettingsPage({ onChangeOrganization, organization }: SettingsPageProps): ReactNode {
  const { setOrganizations } = useUser();
  const { formatMessage } = useIntl();
  const push = useMessages();
  const navigate = useNavigate();
  const inputOrganization = useRef(null);
  const [fetchedApps, setFetchedApps] = useState<App[]>([]);
  const [fetchedAppCollections, setFetchedAppCollections] = useState<AppCollection[]>([]);
  const [fetchedBlocks, setFetchedBlocks] = useState<Block[]>([]);
  const [country, setCountry] = useState<string>(organization.countryCode || '');
  const countryNames = countries.getNames('en');

  const fetch = useCallback(async () => {
    const apps = await axios.get(`/api/organizations/${organization.id}/apps`);
    setFetchedApps(apps.data);
    const appCollections = await axios.get(`/api/organizations/${organization.id}/app-collections`);
    setFetchedAppCollections(appCollections.data);
    const blocks = await axios.get(`/api/organizations/${organization.id}/blocks`);
    setFetchedBlocks(blocks.data);
  }, [organization.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  const deleteOrganization = async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/organizations/${id}`);
      push({
        body: formatMessage(messages.deleteSuccess, {
          name: organization.name,
        }),
        color: 'info',
      });
      navigate('/');
    } catch {
      push(formatMessage(messages.errorDelete));
    }
  };

  const changeCountry = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>) => {
      setCountry(event.target.value);
    },
    [setCountry],
  );

  const deleteOrganizationBody = (): ReactNode => (
    <div>
      <FormattedMessage
        {...messages.organizationIdLabel}
        values={{ organizationId: organization.id, bold: (str) => <b>{str}</b> }}
      />
      <Input
        onChange={(event) => {
          inputOrganization.current = event.target.value;
        }}
        ref={inputOrganization}
        type="text"
      />
      {fetchedApps?.length === 0 && fetchedAppCollections?.length === 0 ? (
        <FormattedMessage {...messages.deleteWarning} />
      ) : (
        <FormattedMessage
          {...messages.deleteWithAppsWarning}
          values={{ apps: fetchedApps?.length, appCollections: fetchedAppCollections?.length }}
        />
      )}
    </div>
  );

  const onDeleteOrganization = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: deleteOrganizationBody(),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      if (inputOrganization.current === organization.id) {
        await deleteOrganization(organization.id);
      } else {
        push(formatMessage(messages.notMatchingOrgIds));
      }
    },
  });

  const onEditOrganization = useCallback(
    async ({
      city,
      countryCode,
      description,
      email,
      houseNumber,
      icon,
      invoiceReference,
      locale,
      name,
      streetName,
      vatIdNumber,
      website,
      websiteProtocol,
      zipCode,
    }: typeof defaultValues) => {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('description', description);
      formData.set('email', email);
      formData.set('locale', locale);
      formData.set('website', website ? `${websiteProtocol}://${website}` : '');
      formData.set('vatIdNumber', vatIdNumber);
      formData.set('streetName', streetName);
      formData.set('houseNumber', houseNumber);
      formData.set('city', city);
      formData.set('zipCode', zipCode);
      formData.set('countryCode', countryCode);
      formData.set('invoiceReference', invoiceReference);

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organization.id}`, formData);
      setOrganizations((organizations) =>
        organizations.map((org) =>
          org.id === organization.id
            ? {
                ...org,
                name,
                description,
                website,
                email,
                locale,
                vatIdNumber,
                streetName,
                houseNumber,
                city,
                zipCode,
                countryCode,
                invoiceReference,
              }
            : org,
        ),
      );
      onChangeOrganization({
        ...organization,
        name,
        description,
        website,
        email,
        locale,
        vatIdNumber,
        streetName,
        houseNumber,
        city,
        zipCode,
        countryCode,
        invoiceReference,
      });
    },
    [organization, setOrganizations, onChangeOrganization],
  );

  useMeta(formatMessage(messages.settings));

  const defaultValues = useMemo(
    () => ({
      name: organization.name || '',
      email: organization.email || '',
      website: organization.website?.replace(/^https?:\/\//, '') || '',
      websiteProtocol: organization.website?.startsWith('http://') ? 'http' : 'https',
      description: organization.description || '',
      locale: organization.locale || 'en',
      icon: null as null,
      vatIdNumber: organization.vatIdNumber || '',
      streetName: organization.streetName || '',
      houseNumber: organization.houseNumber || '',
      city: organization.city || '',
      zipCode: organization.zipCode || '',
      countryCode: organization.countryCode || '',
      invoiceReference: organization.invoiceReference || '',
    }),
    [organization],
  );

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} values={{ name: organization.name }} />
      </Title>
      <SimpleForm defaultValues={defaultValues} onSubmit={onEditOrganization}>
        <SimpleFormField
          help={<FormattedMessage {...messages.nameDescription} />}
          label={<FormattedMessage {...messages.name} />}
          maxLength={30}
          minLength={1}
          name="name"
        />
        <SimpleFormField
          addonLeft={
            <SimpleFormField component={Select} name="websiteProtocol">
              <option value="https">https://</option>
              <option value="http">http://</option>
            </SimpleFormField>
          }
          help={<FormattedMessage {...messages.websiteDescription} />}
          label={<FormattedMessage {...messages.website} />}
          name="website"
          preprocess={preprocessWebsite}
        />
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
          help={<FormattedMessage {...messages.descriptionDescription} />}
          label={<FormattedMessage {...messages.description} />}
          maxLength={160}
          name="description"
        />
        <SimpleFormField
          component={SelectField}
          help={<FormattedMessage {...messages.preferredLanguageHelp} />}
          icon="language"
          label={<FormattedMessage {...messages.preferredLanguage} />}
          name="locale"
          required
        >
          {Object.entries(supportedOrganizationLanguages).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </SimpleFormField>
        <SimpleFormField
          accept="image/jpeg, image/png, image/tiff, image/webp"
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.logo} />}
          fileLabel={<FormattedMessage {...messages.selectFile} />}
          help={<FormattedMessage {...messages.logoDescription} />}
          label={<FormattedMessage {...messages.logo} />}
          name="icon"
          preview={<IconPreview organization={organization} />}
        />
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </SimpleForm>
      <Collapsible collapsed={false} title={<FormattedMessage {...messages.payments} />}>
        <FormattedMessage {...messages.paymentsHelp} />
        <SimpleForm defaultValues={defaultValues} onSubmit={onEditOrganization}>
          <SimpleFormField
            component={SelectField}
            help={<FormattedMessage {...messages.descriptionCountry} />}
            label={<FormattedMessage {...messages.country} />}
            name="countryCode"
            onChange={changeCountry}
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
            help={<FormattedMessage {...messages.descriptionStreetName} />}
            label={<FormattedMessage {...messages.streetName} />}
            maxLength={20}
            name="streetName"
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.descriptionHouseNumber} />}
            label={<FormattedMessage {...messages.houseNumber} />}
            maxLength={20}
            name="houseNumber"
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.descriptionCity} />}
            label={<FormattedMessage {...messages.city} />}
            maxLength={20}
            name="city"
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.descriptionZipCode} />}
            label={<FormattedMessage {...messages.zipCode} />}
            maxLength={20}
            name="zipCode"
          />
          <SimpleFormField
            help={<FormattedMessage {...messages.descriptionInvoiceReference} />}
            label={<FormattedMessage {...messages.invoiceReference} />}
            maxLength={100}
            name="invoiceReference"
          />
          <SimpleSubmit>
            <FormattedMessage {...messages.submit} />
          </SimpleSubmit>
        </SimpleForm>
      </Collapsible>
      {organization.role === 'Owner' ? (
        <Content>
          <Message
            className={styles.dangerZone}
            color="danger"
            header={<FormattedMessage {...messages.dangerZone} />}
          >
            <p className="content">
              <FormattedMessage {...messages.deleteHelp} />
            </p>
            <Button
              color="danger"
              disabled={Boolean(fetchedAppCollections?.length || fetchedBlocks?.length)}
              icon="trash-alt"
              onClick={onDeleteOrganization}
            >
              <FormattedMessage {...messages.delete} />
            </Button>
          </Message>
        </Content>
      ) : (
        ''
      )}
    </>
  );
}
