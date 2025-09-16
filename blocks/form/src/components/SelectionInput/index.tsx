import { FormattedMessage, useBlock } from '@appsemble/preact';
import {
  Button,
  FormButtons,
  Input,
  Loader,
  Message,
  ModalCard,
  useToggle,
} from '@appsemble/preact-components';
import classNames from 'classnames';
import { type Ref, type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

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
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: SelectionInputProps): VNode {
  const { actions, events, utils } = useBlock();
  const {
    allowRemovalFromModal = false,
    disableSearch = false,
    showSelectedInModal = false,
  } = field;
  const [loading, setLoading] = useState('event' in field);
  const [options, setOptions] = useState('event' in field ? [] : field.selection);
  const [optionsError, setOptionsError] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string | null>(null);

  const selectedOptions = getValueByNameSequence(name, formValues) as SelectionChoice[];

  const [filteredOptions, setFilteredOptions] = useState<SelectionChoice[]>([]);

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
    /* @ts-expect-error strictNullChecks */
    onChange(name, [...selectedOptions, options.find((option) => option.id === id)]);

    if (selectedOptions.length + 1 === maxItems) {
      modal.disable();
    }
  };

  const deselectOption = (id: number | string): void => {
    if (field.onRemoveChoice) {
      actions[field.onRemoveChoice](selectedOptions.find((option) => option.id === id));
    }
    onChange(
      name,
      selectedOptions.filter((selectedOption) => selectedOption.id !== id),
    );
  };

  const getOptionsFilteredBySelection = useCallback(
    (): SelectionChoice[] =>
      showSelectedInModal
        ? options
        : options.filter(
            (option) => !selectedOptions.some((selectedOption) => selectedOption.id === option.id),
          ),
    [options, selectedOptions, showSelectedInModal],
  );

  const handleModalOpen = (): void => {
    const filtered = getOptionsFilteredBySelection();
    setFilteredOptions(filtered);
    modal.enable();
  };

  const handleSearch = (e: any, value: number | string): void => {
    setSearchString(String(value).toLowerCase());
  };

  useEffect(() => {
    let filtered = getOptionsFilteredBySelection();

    if (searchString) {
      filtered = filtered.filter(
        (option) =>
          String(option.header).toLowerCase().includes(searchString) ||
          option.fields?.some((optionField) =>
            String(optionField.value).toLowerCase().includes(searchString),
          ),
      );
    }

    setFilteredOptions(filtered);
  }, [getOptionsFilteredBySelection, options, searchString, selectedOptions]);

  return (
    <div
      className={classNames('appsemble-selection mb-4', className, styles['selection-wrapper'])}
      id={name}
      ref={errorLinkRef as unknown as Ref<HTMLDivElement>}
    >
      <div className="is-flex is-justify-content-space-between">
        <div className="title is-5 mb-4">{utils.remap(field.label, selectedOptions) as string}</div>
        {minItems ? null : (
          <span className="is-pulled-right has-text-weight-normal">
            {utils.formatMessage('optionalLabel')}
          </span>
        )}
      </div>
      <div>
        {selectedOptions.map((option) => (
          <SelectionEntry
            key={option.id}
            onRemove={deselectOption}
            option={option}
            showRemove={!readOnly && !disabled}
          />
        ))}
      </div>
      {!readOnly && (!maxItems || selectedOptions.length < maxItems) ? (
        <FormButtons>
          <Button disabled={disabled} icon="plus" onClick={handleModalOpen}>
            {utils.remap(field.addLabel ?? 'Add', selectedOptions) as string}
          </Button>
        </FormButtons>
      ) : null}
      <ModalCard isActive={modal.enabled} onClose={modal.disable}>
        {!disableSearch && <Input className="mb-2" onChange={handleSearch} />}
        {loading ? (
          <Loader />
        ) : optionsError ? (
          <Message className="mt-4 mr-6 mb-4 ml-5" color="danger">
            <span>
              <FormattedMessage id="selectionOptionsError" />
            </span>
          </Message>
        ) : filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <SelectionOption
              key={option.id}
              mayRemove={allowRemovalFromModal}
              onAdd={selectOption}
              onRemove={deselectOption}
              option={option}
              selected={selectedOptions.some((o) => o.id === option.id)}
            />
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
