import {
  Content,
  Loader,
  MarkdownContent,
  Message,
  Select,
  Subtitle,
  Title,
} from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import type { Definition } from 'typescript-json-schema';

import HelmetIntl from '../HelmetIntl';
import ActionTable from './components/ActionTable';
import EventTable from './components/EventTable';
import ParameterTable from './components/ParameterTable';
import TypeTable from './components/TypeTable';
import styles from './index.css';
import messages from './messages';

interface BlockDetailsRoutesMatch {
  /**
   * The organization of the block.
   */
  organization: string;

  /**
   * The name of the block.
   */
  blockName: string;

  /**
   * The version of the block.
   */
  version: string;
}

/**
 * Render documentation for blocks.
 */
export default function BlockDetails(): React.ReactElement {
  const [blockVersions, setBlockVersions] = React.useState<BlockManifest[]>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const intl = useIntl();
  const match = useRouteMatch<BlockDetailsRoutesMatch>();
  const history = useHistory();
  const { blockName, organization, version: urlVersion } = match.params;

  React.useEffect(() => {
    axios
      .get<BlockManifest[]>(`/api/blocks/@${organization}/${blockName}/versions`)
      .then(async (result) => {
        setBlockVersions(result.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [blockName, history, match.url, organization, urlVersion]);

  const onSelectedVersionChange = React.useCallback(
    async (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      history.push(match.url.replace(urlVersion, value));
    },
    [history, match.url, urlVersion],
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

  const selectedBlockManifest = blockVersions.find((block) => block.version === urlVersion);

  if (!selectedBlockManifest) {
    return <Redirect to={`${match.url}/${blockVersions[0].version}`} />;
  }

  return (
    <>
      <HelmetIntl title={messages.title} titleValues={{ name: `@${organization}/${blockName}` }} />
      <Content className={`content ${styles.content}`}>
        <div>
          <figure className={`image is-inline-block is-marginless is-64x64 ${styles.logo}`}>
            <img
              alt={intl.formatMessage(messages.blockIcon)}
              src={`/api/blocks/@${organization}/${blockName}/versions/${urlVersion}/icon`}
            />
          </figure>
          <header className="is-inline-block">
            <Title level={2}>{blockName}</Title>
            <Subtitle level={4}>@{organization}</Subtitle>
          </header>
        </div>
        <Select
          disabled={blockVersions.length === 1}
          label={<FormattedMessage {...messages.selectedVersion} />}
          name="selectedVersion"
          onChange={onSelectedVersionChange}
          required
          value={urlVersion}
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
        {selectedBlockManifest.description && (
          <Message>{selectedBlockManifest.description}</Message>
        )}
        {selectedBlockManifest.longDescription && (
          <MarkdownContent
            className={styles.description}
            content={selectedBlockManifest.longDescription}
          />
        )}

        {Object.keys(selectedBlockManifest.parameters || {}).length > 0 && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.parameters} />
            </Title>
            <ParameterTable parameters={selectedBlockManifest.parameters} />
          </>
        )}
        {Object.keys(selectedBlockManifest.actions || {}).length > 0 && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.actions} />
            </Title>
            <ActionTable manifest={selectedBlockManifest} />
          </>
        )}
        {(selectedBlockManifest.events?.emit || selectedBlockManifest.events?.listen) && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.events} />
            </Title>
            <EventTable manifest={selectedBlockManifest} />
          </>
        )}

        {selectedBlockManifest.parameters?.definitions && (
          <>
            <Title level={4}>
              <FormattedMessage {...messages.definitions} />
            </Title>
            {Object.entries((selectedBlockManifest.parameters as any).definitions).map(
              ([key, definition]: [string, Definition]) => (
                <React.Fragment key={key}>
                  <Title level={5}>
                    <a href={`${match.url}#${key}`} id={key}>
                      {key}
                    </a>
                  </Title>
                  {definition.description && <MarkdownContent content={definition.description} />}
                  {definition.type === 'object' || definition.type === 'array' ? (
                    <ParameterTable parameters={definition} />
                  ) : (
                    <TypeTable definition={definition} />
                  )}
                </React.Fragment>
              ),
            )}
          </>
        )}
      </Content>
    </>
  );
}
