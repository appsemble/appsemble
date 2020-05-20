import RefParser from '@apidevtools/json-schema-ref-parser';
import { Content, Loader, Message, Select, Table, Title } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
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

  return (
    <>
      <HelmetIntl title={messages.title} titleValues={{ name: `@${organization}/${blockName}` }} />
      <Content className={`content ${styles.content}`}>
        <Title level={3}>{blockName}</Title>
        <Title className="subtitle" level={4}>
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

        <Title level={5}>
          <FormattedMessage {...messages.description} />
        </Title>
        <p>{resolvedBlockManifest.description}</p>

        <Title level={5}>
          <FormattedMessage {...messages.parameters} />
        </Title>
        <Table>
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.name} />
              </th>
              <th>
                <FormattedMessage {...messages.required} />
              </th>
              <th>
                <FormattedMessage {...messages.type} />
              </th>
              <th>
                <FormattedMessage {...messages.description} />
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries((resolvedBlockManifest.parameters as any).properties).map(
              ([key, value]) => (
                <tr>
                  <td>{key}</td>
                  <td>
                    {(resolvedBlockManifest.parameters as any).required?.includes(key) ? (
                      <FormattedMessage {...messages.true} />
                    ) : (
                      <FormattedMessage {...messages.false} />
                    )}
                  </td>
                  <td>{(value as any).type}</td>
                  <td>{(value as any).description}</td>
                </tr>
              ),
            )}
          </tbody>
        </Table>
        {Object.keys(resolvedBlockManifest.actions).length && (
          <>
            <Title level={5}>
              <FormattedMessage {...messages.actions} />
            </Title>
            <Table>
              <thead>
                <tr>
                  <th>
                    <FormattedMessage {...messages.name} />
                  </th>
                  <th>
                    <FormattedMessage {...messages.required} />
                  </th>
                  <th>
                    <FormattedMessage {...messages.description} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(resolvedBlockManifest.actions).map(([key, value]) => (
                  <tr>
                    <td>{key}</td>
                    <td>
                      {value.required ? (
                        <FormattedMessage {...messages.true} />
                      ) : (
                        <FormattedMessage {...messages.false} />
                      )}
                    </td>
                    <td>{(value as any).description}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Content>
    </>
  );
}
