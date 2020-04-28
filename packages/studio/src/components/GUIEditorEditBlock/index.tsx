import { Button, Loader, useMessages } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import React from 'react';
import { useIntl } from 'react-intl';

import { GuiEditorStep } from '../Editor';
import type { SelectedBlockManifest } from '../GUIEditor';
import JSONSchemaEditor from '../JSONSchemaEditor';
import type { EditLocation } from '../MonacoEditor';
import styles from './index.css';
import messages from './messages';

interface Resource {
  id: number;
  [key: string]: any;
}

interface GUIEditorEditBlockProps {
  save: (edittedParams: any) => void;
  selectedBlock: SelectedBlockManifest;
  setEditorStep: (value: GuiEditorStep) => void;
  app: App;
  editLocation: EditLocation;
}

export default function GUIEditorEditBlock({
  app,
  editLocation,
  save,
  selectedBlock,
  setEditorStep,
}: GUIEditorEditBlockProps): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const [editingResource, setEditingResource] = React.useState<Resource>(undefined);

  const submit = (): void => {
    const requiredParam = selectedBlock.parameters.required;
    const emptyRequiredParam: any[] = [];

    Object.keys(selectedBlock.parameters.properties).map((item: any) => {
      if (requiredParam !== undefined) {
        requiredParam.map((requiredItem: string) => {
          if (
            (item.includes(requiredItem) && editingResource[item] === undefined) ||
            (item.includes(requiredItem) && editingResource[item] === '')
          ) {
            emptyRequiredParam.push(item);
          }
          return emptyRequiredParam;
        });
      }
      return requiredParam;
    });

    if (emptyRequiredParam.length === 0) {
      save(editingResource);
    } else {
      emptyRequiredParam.map((requiredItem: string) =>
        push({
          body: intl.formatMessage(messages.errorRequiredParams) + requiredItem,
          color: 'warning',
        }),
      );
    }
  };

  // TODO: Duplicated onChange function from ResourceTable
  const onChange = React.useCallback(
    (event: any, value: any) => {
      let name = '';
      if (event?.target.name) {
        name = event.target.name;
      } else {
        name = event.currentTarget.name;
      }
      if (name.includes('.')) {
        const objectParentName = name.split(/\./g)[0];
        name = objectParentName;
      }
      if (name === 'id') {
        return;
      }
      setEditingResource({
        ...editingResource,
        [name]: value,
      });
    },
    [editingResource],
  );

  React.useEffect(() => {
    if (selectedBlock === undefined) {
      app.definition.pages.map((page: any) => {
        if (page.name.includes(editLocation.pageName)) {
          page.blocks.map((val: any) => {
            if (val.type.includes(editLocation.blockName)) {
              if (!editingResource) {
                Object.entries(val.parameters).map((param: any) => {
                  setEditingResource({
                    ...editingResource,
                    [param[0]]: param[1],
                  });
                  return param;
                });
              }
            }
            return val;
          });
        }
        return page;
      });
    }
  }, [editingResource, editLocation.pageName, editLocation.blockName, app, selectedBlock]);

  if (selectedBlock === undefined) {
    return <Loader />;
  }

  const keys =
    selectedBlock?.parameters !== null
      ? [...Object.keys(selectedBlock?.parameters.properties || {})]
      : undefined;

  return (
    <div className={styles.flexContainer} onSubmit={submit}>
      <h2 className="title">{stripBlockName(selectedBlock.name)}</h2>
      <div className={styles.main}>
        {keys ? (
          keys.map((key) => (
            <JSONSchemaEditor
              key={key}
              name={key}
              onChange={onChange}
              required={selectedBlock?.parameters?.required?.includes(key)}
              schema={selectedBlock}
              value={editingResource?.[key]}
            />
          ))
        ) : (
          <div>{stripBlockName(selectedBlock.name)} has no editable parameters </div>
        )}
      </div>
      <div className={styles.footer}>
        <Button
          className="button is-warning"
          icon="angle-left"
          onClick={() => setEditorStep(GuiEditorStep.ADD)}
          style={{ alignContent: 'flex-start' }}
        >
          {intl.formatMessage(messages.back)}
        </Button>
        <Button
          className="button is-success"
          icon="check"
          onClick={submit}
          style={{ alignContent: 'flex-end' }}
        >
          {intl.formatMessage(messages.save)}
        </Button>
      </div>
    </div>
  );
}
