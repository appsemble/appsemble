import { Button, Checkbox, Form, Input, Loader, useMessages } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { useIntl } from 'react-intl';

import { GuiEditorStep } from '../Editor';
import type { Block } from '../GUIEditorToolboxBlock';
import styles from './index.css';
import messages from './messages';

enum parameterType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  NUMBER = 'number',
}

interface SelectedBlock extends BlockManifest {
  parameters: {
    properties: any;
    required?: string[];
  };
}

interface GUIEditorEditBlockProps {
  save: (edittedParams: object[], selectedBlockParams: SelectedBlock) => void;
  selectedBlock: Block;
  setEditorStep: (value: GuiEditorStep) => void;
}

export default function GUIEditorEditBlock({
  save,
  selectedBlock,
  setEditorStep,
}: GUIEditorEditBlockProps): React.ReactElement {
  const [selectedBlockParams, setSelectedBlockParams] = React.useState<SelectedBlock>();
  const edittedParams: any[any] = [];
  const intl = useIntl();
  const push = useMessages();

  React.useEffect(() => {
    const getBlockParameters = async (): Promise<void> => {
      setSelectedBlockParams(undefined);
      // TODO: get block version
      const { data } = await axios.get(`/api/blocks/${selectedBlock.name}/versions/0.11.6`);
      if (data !== undefined) {
        setSelectedBlockParams(data);
      }
    };
    getBlockParameters();
  }, [selectedBlock.name]);

  const submit = (): void => {
    const requiredParam = selectedBlockParams.parameters.required;
    const emptyRequiredParam: any[] = [];

    Object.keys(selectedBlockParams.parameters.properties).map((item: any) => {
      if (requiredParam !== undefined) {
        requiredParam.map((requiredItem: string) => {
          if (
            (item.includes(requiredItem) && edittedParams[item] === undefined) ||
            (item.includes(requiredItem) && edittedParams[item] === '')
          ) {
            emptyRequiredParam.push(item);
          }
          return emptyRequiredParam;
        });
      }
      return requiredParam;
    });

    if (emptyRequiredParam.length === 0) {
      save(edittedParams, selectedBlockParams);
    } else {
      emptyRequiredParam.map((requiredItem: string) =>
        push({
          body: intl.formatMessage(messages.errorRequiredParams) + requiredItem,
          color: 'warning',
        }),
      );
    }
  };

  function handleChange(event: any, name: any): void {
    const { target } = event;
    const { type } = selectedBlockParams.parameters.properties[name];
    if (type === parameterType.BOOLEAN) {
      edittedParams[name] = target.checked;
    } else if (type === parameterType.STRING) {
      edittedParams[name] = `'${target.value}'`;
    } else {
      edittedParams[name] = `${target.value}`;
    }
  }

  // function to make proper input field/form per param type
  function renderInputFields(item: string, i: any): any {
    const schema = selectedBlockParams.parameters.properties[item];
    const requiredParam = selectedBlockParams.parameters.required;
    const required = requiredParam !== undefined ? requiredParam.includes(item) : false;

    // TODO: make title field in API and call title instead of normalizing this way
    const label = item.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

    switch (schema.type) {
      case parameterType.STRING:
        return (
          <div key={i} className="field" tabIndex={i}>
            <label className="label" style={{ textTransform: 'capitalize' }}>
              {label} {required ? <strong>*</strong> : ''}
            </label>
            <div className="control">
              {item.includes('content') || item.includes('description') ? (
                <textarea
                  className="textarea"
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange(event, item)
                  }
                  placeholder={item}
                  value={edittedParams[i]}
                />
              ) : (
                <Input
                  className="input"
                  name="text"
                  onChange={(event) => handleChange(event, item)}
                  placeholder={item}
                  type="text"
                  value={edittedParams[i]}
                />
              )}
            </div>
          </div>
        );
      case parameterType.BOOLEAN:
        return (
          <div key={i} className="field" tabIndex={i}>
            <div className="control">
              <label className="checkbox" style={{ textTransform: 'capitalize' }}>
                <Checkbox
                  checked={edittedParams[i]}
                  name="boolean"
                  onChange={(event) => handleChange(event, item)}
                />
                {` ${label}`} {required ? <strong>*</strong> : ''}
              </label>
            </div>
          </div>
        );
      case parameterType.INTEGER:
      case parameterType.NUMBER:
        return (
          <div key={i} className="field" tabIndex={i}>
            <div className="control">
              <label className="label" style={{ textTransform: 'capitalize' }}>
                {label} {required ? <strong>*</strong> : ''}
              </label>
              <Input
                checked={edittedParams[i]}
                className="input"
                name="number"
                onChange={(event) => handleChange(event, item)}
                type="number"
              />
            </div>
          </div>
        );
      default:
        return (
          <div key={i} className="field" tabIndex={i}>
            {item}: {schema.type}
          </div>
        );
    }
  }

  if (selectedBlockParams === undefined) {
    return <Loader />;
  }

  return (
    <Form className={styles.flexContainer} onSubmit={submit}>
      <h2 className="title">{stripBlockName(selectedBlock.name)}</h2>
      <div className={styles.main}>
        {Object.keys(selectedBlockParams.parameters.properties).map((item: any, i: any) =>
          renderInputFields(item, i),
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
    </Form>
  );
}
