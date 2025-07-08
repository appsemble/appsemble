import { defaultLocale, stripBlockName } from '@appsemble/lang-sdk';
import {
  Content,
  Icon,
  Loader,
  Message,
  SelectField,
  Subtitle,
  Title,
  useData,
  useMeta,
} from '@appsemble/react-components';
import { type BlockManifest } from '@appsemble/types';
import { type ChangeEvent, type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isMap, parseDocument } from 'yaml';

import { ActionTable } from './ActionTable/index.js';
import { EventTable } from './EventTable/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { RefLink } from './RefLink/index.js';
import { CodeBlock } from '../../../components/CodeBlock/index.js';
import { MarkdownContent } from '../../../components/MarkdownContent/index.js';
import { Schema } from '../../../components/Schema/index.js';

/**
 * Render documentation for blocks.
 */
export function BlockPage(): ReactNode {
  const { formatMessage } = useIntl();

  const {
    blockName,
    organization,
    version: urlVersion,
  } = useParams<{
    organization: string;
    blockName: string;
    version: string;
  }>();

  const navigate = useNavigate();

  const { data: blockVersions, error: fetchError } = useData<string[]>(
    `/api/blocks/${organization}/${blockName}/versions/list`,
  );

  const onSelectedVersionChange = useCallback(
    (event: ChangeEvent, value: string) => {
      navigate(`../${value}`, {
        relative: 'path',
      });
    },
    [navigate],
  );
  const blockUrl =
    urlVersion === undefined
      ? `/api/blocks/${organization}/${blockName}`
      : `/api/blocks/${organization}/${blockName}/versions/${urlVersion}`;

  const { data: selectedBlockManifest, error, loading } = useData<BlockManifest>(blockUrl);

  useMeta(`${organization}/${blockName}`, selectedBlockManifest?.description);

  const examples = useMemo(
    () =>
      selectedBlockManifest?.examples?.map((example) => {
        const doc = parseDocument(example);
        const { contents } = doc;
        if (isMap(contents)) {
          contents.items.unshift(
            doc.createPair('type', stripBlockName(selectedBlockManifest.name)),
            doc.createPair('version', selectedBlockManifest.version),
          );
        }
        return String(doc);
      }) ?? [],
    [selectedBlockManifest],
  );

  if (error || fetchError) {
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
    <Content className={`content ${styles.content}`}>
      <>
        <figure className="image is-inline-block is-marginless is-64x64 mr-4">
          {selectedBlockManifest.iconUrl ? (
            <img alt={formatMessage(messages.blockIcon)} src={selectedBlockManifest.iconUrl} />
          ) : (
            <Icon className={styles.iconFallback} icon="cubes" />
          )}
        </figure>
        <header className="is-inline-block">
          <Title lang={defaultLocale} level={2}>
            {blockName}
          </Title>
          <Subtitle lang={defaultLocale} level={4}>
            <Link to={`../../organizations/${organization.replace(/^@/, '')}`}>{organization}</Link>
          </Subtitle>
        </header>
      </>
      <SelectField
        disabled={blockVersions?.length === 1}
        label="Selected version"
        name="selectedVersion"
        onChange={onSelectedVersionChange}
        required
        value={urlVersion}
      >
        {blockVersions?.map((version) => (
          <option key={version} value={version}>
            {version}
          </option>
        ))}
      </SelectField>

      <Title level={4}>Description</Title>
      {selectedBlockManifest.description ? (
        <Message>{selectedBlockManifest.description}</Message>
      ) : null}
      {selectedBlockManifest.longDescription ? (
        <MarkdownContent
          className={styles.description}
          content={selectedBlockManifest.longDescription}
          lang={defaultLocale}
        />
      ) : null}

      {examples.length ? (
        <>
          <Title level={4}>Examples</Title>
          <div className={`is-flex is-flex-column mb-3 ${styles.examples}`}>
            {examples.map((example) => (
              <CodeBlock className="mx-2 mb-1" copy key={example} language="yaml">
                {example}
              </CodeBlock>
            ))}
          </div>
        </>
      ) : null}

      {Object.keys(selectedBlockManifest.parameters || {}).length > 0 && (
        <>
          <Title level={4}>Parameters</Title>
          <Schema anchors renderRef={RefLink} schema={selectedBlockManifest.parameters} />
        </>
      )}
      {Object.keys(selectedBlockManifest.actions || {}).length > 0 && (
        <>
          <Title level={4}>Actions</Title>
          <ActionTable manifest={selectedBlockManifest} />
        </>
      )}
      {selectedBlockManifest.events?.emit || selectedBlockManifest.events?.listen ? (
        <>
          <Title level={4}>Events</Title>
          <EventTable manifest={selectedBlockManifest} />
        </>
      ) : null}

      {selectedBlockManifest.parameters?.definitions ? (
        <>
          <Title level={4}>Definitions</Title>
          {Object.entries(selectedBlockManifest.parameters.definitions).map(([key, definition]) => (
            <div className="mb-4 pl-4" key={key}>
              <Title className="mb-2" lang={defaultLocale} level={5}>
                <a href={`#${key}`} id={key}>
                  {key}
                </a>
              </Title>
              <Schema anchors renderRef={RefLink} schema={definition} />
            </div>
          ))}
        </>
      ) : null}
    </Content>
  );
}
