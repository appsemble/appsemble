import { FormattedMessage, useBlock } from '@appsemble/preact';
import {
  Button,
  FormButtons,
  Loader,
  Message,
  ModalCard,
  useToggle,
} from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { SelectionEntry } from './SelectionEntry/index.js';
import { SelectionOption } from './SelectionOption/index.js';
import {
  type InputProps,
  type SelectionChoice,
  type SelectionField as SelectionFieldInterface,
} from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMaxItems, getMinItems } from '../../utils/requirements.js';

type SelectionInputProps = InputProps<SelectionChoice[], SelectionFieldInterface>;

export function SelectionInput({
  className,
  disabled,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: SelectionInputProps): VNode {
  const { events, utils } = useBlock();
  const [loading, setLoading] = useState('event' in field);
  const [options, setOptions] = useState('event' in field ? [] : field.selection);
  const [optionsError, setOptionsError] = useState<boolean>(false);

  const selectedOptions = getValueByNameSequence(name, formValues) as SelectionChoice[];

  const minItems = getMinItems(field);
  const maxItems = getMaxItems(field);

  const modal = useToggle();

  useEffect(() => {
    if ('selection' in field) {
      return;
    }

    const handleOptions = (result: SelectionChoice[]): void => {
      setOptions(result);
      setLoading(false);
    };

    const handleError = (): void => {
      setOptionsError(true);
      setLoading(false);
    };

    if ('event' in field) {
      const eventHandler = (data: SelectionChoice[], e: string): void => {
        if (e) {
          handleError();
        } else {
          handleOptions(data);
        }
      };
      events.on[field.event](eventHandler);
      return () => events.off[field.event](eventHandler);
    }
  }, [events, field, utils]);

  const selectOption = (id: number): void => {
    onChange(name, [...selectedOptions, options.find((option) => option.id === id)]);

    if (selectedOptions.length + 1 === maxItems) {
      modal.disable();
    }
  };

  const deselectOption = (id: number): void => {
    onChange(
      name,
      selectedOptions.filter((selectedOption) => selectedOption.id !== id),
    );
  };

  const availableOptions = options.filter(
    (option) => !selectedOptions.some((selectedOption) => selectedOption.id === option.id),
  );

  return (
    <div className={classNames('appsemble-selection mb-4', className, styles['selection-wrapper'])}>
      <div className="title is-5 mb-4">{utils.remap(field.label, selectedOptions) as string}</div>
      <div>
        {selectedOptions.map((option) => (
          <SelectionEntry
            key={option.id}
            onRemove={deselectOption}
            option={option}
            showRemove={!readOnly && !disabled && (!minItems || selectedOptions.length > minItems)}
          />
        ))}
      </div>
      {!readOnly && (!maxItems || selectedOptions.length < maxItems) ? (
        <FormButtons>
          <Button disabled={disabled} icon="plus" onClick={modal.enable}>
            {utils.remap(field.addLabel ?? 'Add', selectedOptions) as string}
          </Button>
        </FormButtons>
      ) : null}
      <ModalCard isActive={modal.enabled} onClose={modal.disable}>
        {loading ? (
          <Loader />
        ) : optionsError ? (
          <Message className="mt-4 mr-6 mb-4 ml-5" color="danger">
            <span>
              <FormattedMessage id="selectionOptionsError" />
            </span>
          </Message>
        ) : availableOptions.length > 0 ? (
          availableOptions.map((option) => (
            <SelectionOption key={option.id} onAdd={selectOption} option={option} />
          ))
        ) : (
          <Message className="mt-4 mr-6 mb-4 ml-5">
            <span>
              <FormattedMessage id="selectionNoOptions" />
            </span>
          </Message>
        )}
      </ModalCard>
    </div>
  );
}
