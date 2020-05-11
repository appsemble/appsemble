import { Button, Loader, useMessages } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import type { OpenAPIV3 } from 'openapi-types';
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

  const onChange = React.useCallback((_event: any, value: any) => {
    setEditingResource(value);
  }, []);

  const initBlockParameters = React.useCallback(() => {
    if (selectedBlock === undefined) {
      app.definition.pages.map((pageVal: any) => {
        if (pageVal.name.includes(editLocation.pageName)) {
          pageVal.blocks.map((blockVal: any) => {
            if (blockVal.type.includes(editLocation.blockName)) {
              if (!editingResource) {
                Object.entries(blockVal.parameters).map((param: any) => {
                  setEditingResource((prevEditingResource) => ({
                    ...prevEditingResource,
                    [param[0]]: param[1],
                  }));
                  return param;
                });
              }
            }
            return blockVal;
          });
        }
        return pageVal;
      });
    }
  }, [editingResource, editLocation.pageName, editLocation.blockName, app, selectedBlock]);

  if (selectedBlock === undefined) {
    initBlockParameters();
    return <Loader />;
  }

  return (
    <div className={styles.flexContainer} onSubmit={submit}>
      <h2 className="title">{stripBlockName(selectedBlock.name)}</h2>
      <div className={styles.main}>
        {selectedBlock?.parameters ? (
          <JSONSchemaEditor
            onChange={onChange}
            schema={selectedBlock?.parameters as OpenAPIV3.SchemaObject}
            value={editingResource}
          />
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
