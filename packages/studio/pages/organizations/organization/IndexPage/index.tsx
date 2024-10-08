import { Button, Content, Icon, useData } from '@appsemble/react-components';
import { type App, type BlockManifest, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AppList } from '../../../../components/AppList/index.js';
import { sortFunctions } from '../../../../components/AppListControls/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { BlockCard } from '../../../../components/BlockCard/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { Collapsible } from '../../../../components/Collapsible/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { type Organization } from '../../../../types.js';

interface IndexPageProps {
  readonly organization: Organization;
}

export function IndexPage({ organization }: IndexPageProps): ReactNode {
  const { formatMessage } = useIntl();
  const { organizations } = useUser();
  const { lang } = useParams<{ lang: string; organizationId: string }>();

  const appsResult = useData<App[]>(`/api/organizations/${organization.id}/apps?language=${lang}`);
  const blocksResult = useData<BlockManifest[]>(`/api/organizations/${organization.id}/blocks`);

  const userOrganization = organizations?.find((org) => org.id === organization.id);
  const mayEditOrganization =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.UpdateOrganizations,
    ]);

  return (
    <Content className={`pb-2 ${styles.root}`}>
      <CardHeaderControl
        controls={
          <>
            {mayEditOrganization ? (
              <Button className="mb-3 ml-4" component={Link} to="settings">
                <FormattedMessage {...messages.editOrganization} />
              </Button>
            ) : null}
            {userOrganization ? (
              <Button className="mb-3 ml-4" component={Link} to="members">
                <FormattedMessage {...messages.viewMembers} />
              </Button>
            ) : null}
          </>
        }
        description={organization.description}
        details={
          <>
            {organization.website ? (
              <div className={styles.icon}>
                <Icon icon="globe" />
                <a
                  href={organization.website}
                  rel="noopener noreferrer"
                  target="_blank"
                  title={organization.website}
                >
                  {organization.website.replace(/^(https?:|)\/\//, '')}
                </a>
              </div>
            ) : null}
            {organization.email ? (
              <div className={styles.icon}>
                <Icon icon="envelope" />
                <a href={`mailto:${organization.email}`} title={organization.email}>
                  {organization.email}
                </a>
              </div>
            ) : null}
          </>
        }
        icon={
          organization.iconUrl ? (
            <img
              alt={formatMessage(messages.logo)}
              className="px-4 py-4 card"
              src={organization.iconUrl}
            />
          ) : (
            <Icon className={`px-4 py-4 card ${styles.iconFallback}`} icon="building" />
          )
        }
        subtitle={organization.id}
        title={organization.name || organization.id}
      >
        <div className="px-5 pt-2 pb-4 has-background-white-bis">
          <Collapsible title={<FormattedMessage {...messages.apps} />}>
            <AppList result={appsResult} reverse sortFunction={sortFunctions.rating} />
          </Collapsible>
          <hr className="has-background-grey-lighter" />
          <Collapsible title={<FormattedMessage {...messages.blocks} />}>
            <AsyncDataView
              emptyMessage={<FormattedMessage {...messages.blocksEmpty} />}
              errorMessage={<FormattedMessage {...messages.blocksError} />}
              loadingMessage={<FormattedMessage {...messages.blocksLoading} />}
              result={blocksResult}
            >
              {(blocks) => (
                <div className={styles.blockList}>
                  {blocks.map((block) => (
                    <BlockCard
                      block={block}
                      blockHref={`../../../blocks/${block.name}`}
                      key={block.name}
                      organizationHref="./"
                    />
                  ))}
                </div>
              )}
            </AsyncDataView>
          </Collapsible>
        </div>
      </CardHeaderControl>
    </Content>
  );
}
