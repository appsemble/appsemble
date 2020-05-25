import { Content, Loader, Message, Select, Title } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import axios from 'axios';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import ActionTable from './components/ActionTable';
import EventTable from './components/EventTable';
import ParameterTable from './components/ParameterTable';
import styles from './index.css';
import messages from './messages';

interface BlockDetailsRoutesMatch {
  organization: string;
  blockName: string;
  version: string;
}

export default function BlockDetails(): React.ReactElement {
  const [blockVersions, setBlockVersions] = React.useState<BlockManifest[]>();
  const [selectedVersion, setSelectedVersion] = React.useState<string>();
  const [resolvedBlockManifest, setSelectedBlockManifest] = React.useState<BlockManifest>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const match = useRouteMatch<BlockDetailsRoutesMatch>();
  const history = useHistory();
  const { blockName, organization, version: urlVersion } = match.params;

  React.useEffect(() => {
    try {
      axios
        .get<BlockManifest[]>(`/api/blocks/@${organization}/${blockName}/versions`)
        .then(async (result) => {
          const data = result.data.slice().reverse();
          setBlockVersions(data);
          const versionBlock = urlVersion && data.find((d) => d.version === urlVersion);
          setSelectedVersion(versionBlock?.version ?? data[0].version);
          setSelectedBlockManifest(versionBlock ?? data[0]);

          if (!versionBlock) {
            history.replace(`${match.url}/${data[0].version}`);
          }

          setLoading(false);
        });
    } catch (e) {
      setError(true);
    }
  }, [blockName, history, match.url, organization, urlVersion]);

  const onSelectedVersionChange = React.useCallback(
    async (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      const block = blockVersions.find((b) => b.version === value);
      setSelectedBlockManifest(block);
      history.push(match.url.replace(selectedVersion, value));
      setSelectedVersion(value);
    },
    [blockVersions, history, match.url, selectedVersion],
  );

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

  console.log(resolvedBlockManifest);

  return (
    <>
      <HelmetIntl title={messages.title} titleValues={{ name: `@${organization}/${blockName}` }} />
      <Content className={`content ${styles.content}`}>
        <Title level={2}>{blockName}</Title>
        <Title className="subtitle" level={3}>
          @{organization}
        </Title>
        <Select
          disabled={blockVersions.length === 1}
          label={<FormattedMessage {...messages.selectedVersion} />}
          name="selectedVersion"
          onChange={onSelectedVersionChange}
          required
          value={selectedVersion}
        >
          {blockVersions.map(({ version }) => (
            <option key={version} value={version}>
              {version}
            </option>
          ))}
        </Select>

        <Title level={4}>
          <FormattedMessage {...messages.description} />
        </Title>
        <p>{resolvedBlockManifest.description}</p>

        {Object.keys(resolvedBlockManifest.parameters || {}).length > 0 && (
          <>
            <Title level={5}>
              <FormattedMessage {...messages.parameters} />
            </Title>
            <ParameterTable manifest={resolvedBlockManifest} />
          </>
        )}
        {Object.keys(resolvedBlockManifest.actions || {}).length > 0 && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.actions} />
            </Title>
            <ActionTable manifest={resolvedBlockManifest} />
          </>
        )}
        {(resolvedBlockManifest.events?.emit || resolvedBlockManifest.events?.listen) && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.events} />
            </Title>
            <EventTable manifest={resolvedBlockManifest} />
          </>
        )}

        {(resolvedBlockManifest.parameters as any).definitions && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.definitions} />
            </Title>
            {Object.entries(
              (resolvedBlockManifest.parameters as any).definitions as {
                [key: string]: OpenAPIV3.SchemaObject;
              },
            ).map(([key, definition]) => (
              <Title key={key} level={5}>
                {key}
              </Title>
            ))}
          </>
        )}
      </Content>
    </>
  );
}
