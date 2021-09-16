import {
  Loader,
  useBeforeUnload,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { AppDefinition, BlockManifest, SSLStatusMap } from '@appsemble/types';
import { filterBlocks, getAppBlocks, schemas, validateStyle } from '@appsemble/utils';
import axios, { AxiosError } from 'axios';
import equal from 'fast-deep-equal';
import { dump, load } from 'js-yaml';
import { Validator } from 'jsonschema';
import { editor } from 'monaco-editor';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { useApp } from '..';
import { MonacoEditor } from '../../../../components/MonacoEditor';
import { getAppUrl } from '../../../../utils/getAppUrl';
import { EditorNavBar } from './EditorNavBar';
import styles from './index.module.css';
import { messages } from './messages';

const validator = new Validator();

for (const [name, schema] of Object.entries(schemas)) {
  // This is only safe, because our schema names don’t contain special characters.
  validator.addSchema(schema, `#/components/schemas/${name}`);
}

/**
 * These properties are passed to the allow attribute of the app preview. For a full list, see
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
 */
const allow = [
  'autoplay',
  'camera',
  'geolocation',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'sync-xhr',
  'usb',
];

export default function EditPage(): ReactElement {
  useMeta(messages.title);

  const { app, setApp } = useApp();

  const [appDefinition, setAppDefinition] = useState<string>(null);
  const [coreStyle, setCoreStyle] = useState('');
  const [sharedStyle, setSharedStyle] = useState('');
  const [initialDefinition, setInitialDefinition] = useState('');
  const [valid, setValid] = useState(false);
  const [dirty, setDirty] = useState(true);

  const frame = useRef<HTMLIFrameElement>();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const push = useMessages();

  useEffect(() => {
    const { id } = params;

    if (!location.hash) {
      history.push('#editor');
    }

    const getStyles = async (): Promise<void> => {
      try {
        const { data: coreStyleData } = await axios.get(`/api/apps/${id}/style/core`);
        const { data: sharedStyleData } = await axios.get(`/api/apps/${id}/style/shared`);

        setCoreStyle(coreStyleData);
        setSharedStyle(sharedStyleData);
      } catch (error: unknown) {
        const { response } = error as AxiosError;
        if (response?.status === 404 || response?.status === 401) {
          push(formatMessage(messages.appNotFound));
        } else {
          push(formatMessage(messages.error));
        }
      }
    };

    getStyles();

    // Destructuring path, and organizationId also hides these technical details for the user
    const { definition } = app;
    let { yaml: yamlDefinition } = app;

    if (!yamlDefinition) {
      yamlDefinition = dump(definition);
      push({ body: formatMessage(messages.yamlNotFound), color: 'info' });
    }

    setAppDefinition(yamlDefinition);
    setInitialDefinition(yamlDefinition);
  }, [app, history, formatMessage, location.hash, params, push]);

  const onSave = useCallback(async () => {
    let definition: AppDefinition;
    // Attempt to parse the YAML into a JSON object
    try {
      definition = load(appDefinition) as AppDefinition;
    } catch {
      push(formatMessage(messages.invalidYaml));
      setValid(false);
      setDirty(false);
      return;
    }

    try {
      validateStyle(coreStyle);
      validateStyle(sharedStyle);
    } catch {
      push(formatMessage(messages.invalidStyle));
      setValid(false);
      setDirty(false);
      return;
    }

    const validatorResult = validator.validate(definition, schemas.AppDefinition, { base: '#' });
    if (!validatorResult.valid) {
      push({
        body: formatMessage(messages.schemaValidationFailed, {
          properties: validatorResult.errors
            .map((err) => err.property.replace(/^instance\./, ''))
            .join(', '),
        }),
      });
      setValid(false);
      return;
    }
    try {
      const blockManifests: Omit<BlockManifest, 'parameters'>[] = await Promise.all(
        filterBlocks(Object.values(getAppBlocks(definition))).map(async (block) => {
          const { data } = await axios.get<BlockManifest>(
            `/api/blocks/${block.type}/versions/${block.version}`,
          );
          return {
            name: data.name,
            version: data.version,
            layout: data.layout,
            files: data.files,
            actions: data.actions,
            events: data.events,
            languages: data.languages,
          };
        }),
      );
      setValid(true);

      // YAML and schema appear to be valid, send it to the app preview iframe
      delete definition.anchors;
      frame.current?.contentWindow.postMessage(
        { type: 'editor/EDIT_SUCCESS', definition, blockManifests, coreStyle, sharedStyle },
        getAppUrl(app.OrganizationId, app.path),
      );
    } catch {
      push(formatMessage(messages.unexpected));
      setValid(false);
    }
    setDirty(false);
  }, [app, formatMessage, push, appDefinition, sharedStyle, coreStyle]);

  useBeforeUnload(appDefinition !== initialDefinition);

  const appDomain = `${app.path}.${app.OrganizationId}.${window.location.hostname}`;
  const { data: sslStatus, refresh: refreshSSLStatus } = useData<SSLStatusMap>(
    `/api/ssl?${new URLSearchParams({ domains: appDomain })}`,
  );

  useEffect(() => {
    if (sslStatus) {
      for (const status of Object.values(sslStatus)) {
        if (status !== 'ready') {
          const timeout = setTimeout(refreshSSLStatus, 30_000);

          return () => clearTimeout(timeout);
        }
      }
    }
  }, [refreshSSLStatus, sslStatus]);

  const uploadApp = useCallback(async () => {
    if (!valid) {
      return;
    }

    const { id } = params;
    const definition = load(appDefinition) as AppDefinition;

    try {
      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));
      // The MIME type for YAML is not officially registered in IANA.
      // For the time being, x-yaml is used. See also: http://www.iana.org/assignments/media-types/media-types.xhtml
      formData.append('yaml', new Blob([appDefinition], { type: 'text/x-yaml' }));
      formData.append('coreStyle', new Blob([coreStyle], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));

      const { data } = await axios.patch(`/api/apps/${id}`, formData);
      push({ body: formatMessage(messages.updateSuccess), color: 'success' });

      // Update App State
      setApp(data);
    } catch (error: unknown) {
      if ((error as AxiosError).response?.status === 403) {
        push(formatMessage(messages.forbidden));
      } else {
        push(formatMessage(messages.errorUpdate));
      }

      return;
    }

    setDirty(true);
    setInitialDefinition(appDefinition);
  }, [formatMessage, params, push, appDefinition, sharedStyle, coreStyle, setApp, valid]);

  const promptUpdateApp = useConfirmation({
    title: <FormattedMessage {...messages.resourceWarningTitle} />,
    body: <FormattedMessage {...messages.resourceWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.publish} />,
    action: uploadApp,
    color: 'warning',
  });

  const onUpload = useCallback(async () => {
    if (valid) {
      const newApp = load(appDefinition) as AppDefinition;
      const originalApp = load(initialDefinition) as AppDefinition;

      if (!equal(newApp.resources, originalApp.resources)) {
        promptUpdateApp();
        return;
      }

      await uploadApp();
    }
  }, [initialDefinition, promptUpdateApp, appDefinition, uploadApp, valid]);

  const onMonacoChange = useCallback(
    (event: editor.IModelContentChangedEvent, value: string) => {
      switch (location.hash) {
        case '#editor': {
          setAppDefinition(value);
          break;
        }
        case '#style-core':
          setCoreStyle(value);
          break;
        case '#style-shared':
          setSharedStyle(value);
          break;
        default:
          break;
      }

      setDirty(true);
    },
    [location.hash],
  );

  if (appDefinition == null) {
    return <Loader />;
  }

  const src = getAppUrl(app.OrganizationId, app.path);
  let value;
  let language;

  switch (location.hash) {
    case '#style-core':
      value = coreStyle;
      language = 'css';
      break;
    case '#style-shared':
      value = sharedStyle;
      language = 'css';
      break;
    case '#editor':
    default:
      value = appDefinition;
      language = 'yaml';
  }

  return (
    <div className={`${styles.root} is-flex`}>
      <div className={`is-flex is-flex-direction-column ${styles.leftPanel}`}>
        <EditorNavBar dirty={dirty} onPreview={onSave} onUpload={onUpload} valid={valid} />
        <div className={styles.editorForm}>
          <MonacoEditor
            className={styles.editor}
            language={language}
            onChange={onMonacoChange}
            onSave={onSave}
            readOnly={app.locked}
            value={value}
          />
        </div>
      </div>

      <div className={`${styles.rightPanel} is-flex ml-1 px-5 py-5`}>
        {window.location.protocol === 'http:' || sslStatus?.[appDomain] === 'ready' ? (
          <iframe
            allow={allow.map((feature) => `${feature} ${src}`).join('; ')}
            className={styles.appFrame}
            ref={frame}
            src={src}
            title={formatMessage(messages.iframeTitle)}
          />
        ) : (
          <div className="has-background-white is-flex is-flex-direction-column is-flex-grow-1 is-flex-shrink-1 is-align-items-center is-justify-content-center">
            <Loader className={styles.sslLoader} />
            <p className="pt-6">
              <FormattedMessage {...messages.sslGenerating} />
            </p>
            <p>
              <FormattedMessage {...messages.sslInfo} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
