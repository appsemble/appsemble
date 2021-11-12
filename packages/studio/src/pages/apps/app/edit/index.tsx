import {
  useBeforeUnload,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { App, AppDefinition } from '@appsemble/types';
import { getAppBlocks, schemas, validateStyle } from '@appsemble/utils';
import axios, { AxiosError } from 'axios';
import equal from 'fast-deep-equal';
import { Validator } from 'jsonschema';
import { ReactElement, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Redirect, useLocation } from 'react-router-dom';
import { getCachedBlockVersions } from 'studio/src/utils/blockRegistry';
import { parse } from 'yaml';

import { useApp } from '..';
import { AppPreview } from '../../../../components/AppPreview';
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

export default function EditPage(): ReactElement {
  useMeta(messages.title);

  const { app, setApp } = useApp();
  const { id } = app;

  const [appDefinition, setAppDefinition] = useState<string>(app.yaml);
  const { data: coreStyle, setData: setCoreStyle } = useData<string>(`/api/apps/${id}/style/core`);
  const { data: sharedStyle, setData: setSharedStyle } = useData<string>(
    `/api/apps/${id}/style/shared`,
  );

  const [valid, setValid] = useState(false);
  const [dirty, setDirty] = useState(true);

  const frame = useRef<HTMLIFrameElement>();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const push = useMessages();

  const onSave = useCallback(async () => {
    let definition: AppDefinition;
    // Attempt to parse the YAML into a JSON object
    try {
      definition = parse(appDefinition) as AppDefinition;
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
      const blockManifests = await getCachedBlockVersions(getAppBlocks(definition));
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

  useBeforeUnload(appDefinition !== app.yaml);

  const uploadApp = useCallback(async () => {
    if (!valid) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('yaml', appDefinition);
      formData.append('coreStyle', coreStyle);
      formData.append('sharedStyle', sharedStyle);

      const { data } = await axios.patch<App>(`/api/apps/${id}`, formData);
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
  }, [appDefinition, coreStyle, formatMessage, id, push, setApp, sharedStyle, valid]);

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
      const newApp = parse(appDefinition) as AppDefinition;

      if (!equal(newApp.resources, app.definition.resources)) {
        promptUpdateApp();
        return;
      }

      await uploadApp();
    }
  }, [valid, appDefinition, app, uploadApp, promptUpdateApp]);

  const onMonacoChange = useCallback(
    (event, value: string) => {
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
    [location, setCoreStyle, setSharedStyle],
  );

  const monacoProps =
    location.hash === '#editor'
      ? { language: 'yaml', uri: 'app.yaml', value: appDefinition }
      : location.hash === '#style-core'
      ? { language: 'css', uri: 'core.css', value: coreStyle }
      : location.hash === '#style-shared'
      ? { language: 'css', uri: 'shared.css', value: sharedStyle }
      : undefined;

  if (!monacoProps) {
    return <Redirect to={{ ...location, hash: '#editor' }} />;
  }

  return (
    <div className={`${styles.root} is-flex`}>
      <div className={`is-flex is-flex-direction-column ${styles.leftPanel}`}>
        <EditorNavBar dirty={dirty} onPreview={onSave} onUpload={onUpload} valid={valid} />
        <div className={styles.editorForm}>
          <MonacoEditor
            className={styles.editor}
            onChange={onMonacoChange}
            onSave={onSave}
            readOnly={app.locked}
            showDiagnostics
            {...monacoProps}
          />
        </div>
      </div>

      <AppPreview app={app} iframeRef={frame} />
    </div>
  );
}
