import RefParser, { resolve } from '@apidevtools/json-schema-ref-parser';
import { Content, Loader, Message, Select, Table, Title } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import ActionTable from './components/ActionTable';
import EventTable from './components/EventTable';
import ParameterTable from './components/ParameterTable';
import styles from './index.css';
import messages from './messages';

interface BlockDetailsRoutesMatch {
  organization: string;
  blockName: string;
}

export default function BlockDetails(): React.ReactElement {
  const [blockVersions, setBlockVersions] = React.useState<BlockManifest[]>();
  const [selectedVersion, setSelectedVersion] = React.useState<string>();
  const [resolvedBlockManifest, setResolvedBlockManifest] = React.useState<BlockManifest>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const match = useRouteMatch<BlockDetailsRoutesMatch>();
  const { blockName, organization } = match.params;

  React.useEffect(() => {
    try {
      axios
        .get<BlockManifest[]>(`/api/blocks/@${organization}/${blockName}/versions`)
        .then(async (result) => {
          const data = result.data.slice().reverse();
          setBlockVersions(data);
          setSelectedVersion(data[0].version);
          const resolvedParameters = await RefParser.dereference(data[0].parameters);
          setResolvedBlockManifest({ ...data[0], parameters: resolvedParameters } as BlockManifest);
          setLoading(false);
        });
    } catch (e) {
      setError(true);
    }
  }, [blockName, organization]);

  const onSelectedVersionChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedVersion(event.target.value);
      const selectedBlock = blockVersions.find((b) => b.version === event.target.value);
      const resolvedParameters = await RefParser.dereference(selectedBlock.parameters);
      setResolvedBlockManifest({
        ...selectedBlock,
        parameters: resolvedParameters,
      } as BlockManifest);
    },
    [blockVersions],
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
      </Content>
    </>
  );
}
