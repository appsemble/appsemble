import { Button, Loader, useMessages } from '@appsemble/react-components';
import { Block } from '@appsemble/sdk';
import axios from 'axios';
import React from 'react';
import { useIntl } from 'react-intl';

import { GuiEditorStep } from '../Editor';
import styles from './index.css';
import messages from './messages';

enum parameterType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  NUMBER = 'number',
}

export default function GUIEditorEditBlock(params: any): React.ReactElement {
  const [selectedBlockParams, setSelectedBlockParams] = React.useState<Block>();
  const edittedParams: any[any] = [];
  const intl = useIntl();
  const push = useMessages();

  React.useEffect(() => {
    const getBlockParameters = async (): Promise<void> => {
      setSelectedBlockParams(undefined);
      // TODO: get block version
      const { data } = await axios.get(`/api/blocks/${params.selectedBlock.id}/versions/0.11.6`);
      if (data !== undefined) {
        setSelectedBlockParams(data);
      }
    };
    getBlockParameters();
  }, [params.selectedBlock.id]);

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
      params.save(edittedParams, selectedBlockParams);
    } else {
      emptyRequiredParam.map((requiredItem: string) =>
        push({
          body: intl.formatMessage(messages.errorRequiredParams) + requiredItem,
          color: 'warning',
        }),
      );
    }
  };

  function handleChange(event: any, item: any): void {
    const { target } = event;
    const { type } = selectedBlockParams.parameters.properties[item];
    if (type === parameterType.BOOLEAN) {
      edittedParams[item] = target.checked;
    } else if (type === parameterType.STRING) {
      edittedParams[item] = `'${target.value}'`;
    } else {
      edittedParams[item] = `${target.value}`;
    }
  }

  // function to make proper input field/form per param type
  function renderInputFields(item: string, i: any): any {
    const parameterItem = selectedBlockParams.parameters.properties[item];
    const requiredParam = selectedBlockParams.parameters.required;
    const label = item.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    let required = false;

    if (requiredParam !== undefined) {
      requiredParam.map((requiredItem: string) => {
        if (item.includes(requiredItem)) {
          required = true;
        }
        return required;
      });
    }

    if (parameterItem.type !== undefined) {
      switch (parameterItem.type) {
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
                  <input
                    className="input"
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
                  <input
                    checked={edittedParams[i]}
                    onChange={(event) => handleChange(event, item)}
                    type="checkbox"
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
                <input
                  checked={edittedParams[i]}
                  className="input"
                  onChange={(event) => handleChange(event, item)}
                  type="number"
                />
              </div>
            </div>
          );
        default:
          return (
            <div key={i} className="field" tabIndex={i}>
              {item}: {parameterItem.type}
            </div>
          );
      }
    } else {
      return '';
    }
  }

  if (selectedBlockParams === undefined) {
    return <Loader />;
  }

  return (
    <div className={styles.flexContainer}>
      <h1 className="title" style={{ textTransform: 'capitalize' }}>
        <strong>{params.selectedBlock.id.split('/')[1]}</strong>
      </h1>
      <div className={styles.main}>
        {Object.keys(selectedBlockParams.parameters.properties).map((item: any, i: any) =>
          renderInputFields(item, i),
        )}
      </div>
      <div className={styles.footer}>
        <Button
          className="button is-warning"
          icon="angle-left"
          onClick={() => {
            params.setEditorStep(GuiEditorStep.ADD);
          }}
          style={{ alignContent: 'flex-start' }}
        >
          {intl.formatMessage(messages.back)}
        </Button>
        <Button
          className="button is-success"
          icon="check"
          onClick={() => {
            submit();
          }}
          style={{ alignContent: 'flex-end' }}
        >
          {intl.formatMessage(messages.save)}
        </Button>
      </div>
    </div>
  );
}
