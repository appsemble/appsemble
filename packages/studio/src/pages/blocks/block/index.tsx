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
import { BlockManifest } from '@appsemble/types';
import { defaultLocale } from '@appsemble/utils';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, Redirect, useHistory, useRouteMatch } from 'react-router-dom';
import { MarkdownContent } from 'studio/src/components/MarkdownContent';
import { Schema } from 'studio/src/components/Schema';

import { ActionTable } from './ActionTable';
import { EventTable } from './EventTable';
import styles from './index.module.css';
import { messages, untranslatedMessages } from './messages';
import { RefLink } from './RefLink';

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

  /**
   * The currently selected language.
   */
  lang: string;
}

/**
 * Render documentation for blocks.
 */
export function BlockPage(): ReactElement {
  const { formatMessage } = useIntl();
  const {
    params: { blockName, lang, organization, version: urlVersion },
    url,
  } = useRouteMatch<BlockDetailsRoutesMatch>();
  const history = useHistory();

  const {
    data: blockVersions,
    error,
    loading,
  } = useData<BlockManifest[]>(`/api/blocks/@${organization}/${blockName}/versions`);

  const onSelectedVersionChange = useCallback(
    (event, value: string) => {
      history.push(url.replace(urlVersion, value));
    },
    [history, url, urlVersion],
  );

  const selectedBlockManifest = blockVersions?.find((block) => block.version === urlVersion);

  useMeta(`@${organization}/${blockName}`, selectedBlockManifest?.description);

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

  if (!selectedBlockManifest) {
    return <Redirect to={`${url}/${blockVersions[0].version}`} />;
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
            <Link to={`/${lang}/organizations/${organization}`}>@{organization}</Link>
          </Subtitle>
        </header>
      </>
      <SelectField
        disabled={blockVersions.length === 1}
        label={untranslatedMessages.selectedVersion}
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
      </SelectField>

      <Title level={4}>{untranslatedMessages.description}</Title>
      {selectedBlockManifest.description && <Message>{selectedBlockManifest.description}</Message>}
      {selectedBlockManifest.longDescription && (
        <MarkdownContent
          className={styles.description}
          content={selectedBlockManifest.longDescription}
          lang={defaultLocale}
        />
      )}

      {Object.keys(selectedBlockManifest.parameters || {}).length > 0 && (
        <>
          <Title level={4}>{untranslatedMessages.parameters}</Title>
          <Schema anchors renderRef={RefLink} schema={selectedBlockManifest.parameters} />
        </>
      )}
      {Object.keys(selectedBlockManifest.actions || {}).length > 0 && (
        <>
          <Title level={4}>{untranslatedMessages.actions}</Title>
          <ActionTable manifest={selectedBlockManifest} />
        </>
      )}
      {(selectedBlockManifest.events?.emit || selectedBlockManifest.events?.listen) && (
        <>
          <Title level={4}>{untranslatedMessages.events}</Title>
          <EventTable manifest={selectedBlockManifest} />
        </>
      )}

      {selectedBlockManifest.parameters?.definitions && (
        <>
          <Title level={4}>{untranslatedMessages.definitions}</Title>
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
      )}
    </Content>
  );
}
