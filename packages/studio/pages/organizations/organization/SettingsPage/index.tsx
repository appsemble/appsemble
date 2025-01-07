import {
  Button,
  Content,
  FileUpload,
  Input,
  Message,
  Select,
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
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { IconPreview } from '../../../../components/IconPreview/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type Block, type Organization } from '../../../../types.js';

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
    async ({ description, email, icon, name, website, websiteProtocol }: typeof defaultValues) => {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('description', description);
      formData.set('email', email);
      formData.set('website', website ? `${websiteProtocol}://${website}` : '');

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organization.id}`, formData);
      setOrganizations((organizations) =>
        organizations.map((org) =>
          org.id === organization.id ? { ...org, name, description, website, email } : org,
        ),
      );
      onChangeOrganization({ ...organization, name, description, website, email });
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
      icon: null as null,
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
          type="email"
        />
        <SimpleFormField
          help={<FormattedMessage {...messages.descriptionDescription} />}
          label={<FormattedMessage {...messages.description} />}
          maxLength={160}
          name="description"
        />
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
