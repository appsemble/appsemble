import { bootstrap } from '@appsemble/preact';
import { Button, CardFooterButton, Form, ModalCard, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { FieldComponent } from './components/FieldComponent/index.js';
import styles from './index.module.css';
import { type FilterValue, type FilterValues } from '../block.js';
import { toOData } from './utils/toOData.js';

bootstrap(
  ({
    actions,
    events,
    parameters: { defaultFilter, fields, fullscreen, hideButton, highlight = [], icon },
    ready,
    utils,
  }) => {
    const modal = useToggle();
    const [loading, setLoading] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);
    const defaultValues = useMemo(() => {
      const result: FilterValues = {};
      for (const { defaultValue, name, type } of fields) {
        if (defaultValue != null) {
          result[name] = defaultValue;
        } else if (type === 'buttons' || type === 'date-range') {
          result[name] = [];
        } else {
          result[name] = null;
        }
      }
      return result;
    }, [fields]);
    const [values, setValues] = useState(defaultValues);

    const highlightedFields = fields.filter((field) =>
      typeof highlight === 'string' ? field.name === highlight : highlight.includes(field.name),
    );
    const fetchData = useCallback(
      async (submitValues: FilterValues) => {
        setLoading(true);
        try {
          const defaultFilterString = utils.remap(defaultFilter, {}) as string;
          const data = await actions.onLoad({
            $filter: toOData(fields, submitValues, defaultFilterString),
          });
          events.emit.filtered(data);
        } catch (error: unknown) {
          events.emit.filtered(null, error as any);
        }
        setLoading(false);
      },
      [actions, defaultFilter, events, fields, utils],
    );

    const onChange = useCallback(
      (
        { currentTarget: { name } }: JSX.TargetedEvent<HTMLButtonElement | HTMLInputElement>,
        value: FilterValue,
      ) => {
        const newValues = {
          ...values,
          [name]: value,
        };
        setValues(newValues);
        if (typeof highlight === 'string' ? name === highlight : highlight.includes(name)) {
          setShouldFetch(true);
        }
      },
      [highlight, values],
    );

    useEffect(() => {
      const handler = setTimeout(() => {
        if (shouldFetch) {
          fetchData(values);
        }
      }, 300);

      return () => clearTimeout(handler);
    }, [fetchData, shouldFetch, values]);

    const onSubmit = useCallback(
      () => fetchData(values).then(modal.disable),
      [fetchData, modal, values],
    );

    const resetFilter = useCallback(() => {
      setValues(defaultValues);
      return fetchData(defaultValues);
    }, [defaultValues, fetchData]);

    useEffect(() => {
      const refresh = async (): Promise<void> => {
        try {
          const defaultFilterString = utils.remap(defaultFilter, {}) as string;
          const data = await actions.onLoad({
            $filter: toOData(fields, values, defaultFilterString),
          });
          events.emit.refreshed(data);
        } catch (error: unknown) {
          events.emit.refreshed(null, error as any);
        }
      };

      events.on.refresh(refresh);

      return () => events.off.refresh(refresh);
    }, [actions, defaultFilter, events, fields, utils, values]);

    useEffect(ready, [ready]);

    useEffect(() => {
      // Load the initial data when the block is rendered.
      onSubmit();
      // This should only be called once, so `onSubmit` should not be in the dependency array.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showModal = useMemo(
      () =>
        fields.some((field) =>
          typeof highlight === 'string'
            ? field.name !== highlight
            : !highlight.includes(field.name),
        ),
      [fields, highlight],
    );

    const hasHighlight = useMemo(
      () => typeof highlight === 'string' || highlight.length,
      [highlight],
    );

    return (
      <Form
        className={classNames(`is-flex is-flex-direction-column p-4 mb-1 ${styles.root}`, {
          [styles.highlighted]: highlightedFields[0],
        })}
        onSubmit={onSubmit}
      >
        <div
          className={classNames(styles['highlighted-fields-wrapper'], hasHighlight ? 'mb-6' : '')}
        >
          {highlightedFields?.map((highlightedField) => (
            <div
              className={classNames(
                'field',
                styles[
                  highlightedField.type === 'date-range'
                    ? 'wide-highlighted-field'
                    : 'highlighted-field'
                ],
              )}
              key={highlightedField.name}
            >
              {highlightedField.label ? (
                <label className="label">{utils.remap(highlightedField.label, {}) as string}</label>
              ) : null}
              <div className="control">
                <FieldComponent
                  field={highlightedField}
                  highlight
                  loading={loading}
                  onChange={onChange}
                  value={values[highlightedField.name]}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="is-flex is-align-items-center">
          {hasHighlight ? (
            <Button onClick={resetFilter}>{utils.formatMessage('clearLabel')}</Button>
          ) : null}
          {showModal ? (
            <>
              <Button
                className={classNames(
                  'mx-2 my-2',
                  { 'is-primary': true },
                  hideButton ? 'is-hidden' : '',
                )}
                icon={icon || 'filter'}
                loading={loading}
                onClick={modal.enable}
              />
              <ModalCard
                footer={
                  <>
                    <CardFooterButton onClick={resetFilter}>
                      {utils.formatMessage('clearLabel')}
                    </CardFooterButton>
                    <CardFooterButton color="primary" type="submit">
                      {utils.formatMessage('submitLabel')}
                    </CardFooterButton>
                  </>
                }
                fullscreen={fullscreen}
                isActive={modal.enabled}
                onClose={modal.disable}
                title={<span>{utils.formatMessage('modalTitle')}</span>}
              >
                {fields.map(
                  (field) =>
                    highlightedFields.includes(field) || (
                      <div className="field" key={field.name}>
                        {field.label ? (
                          <label className="label">{utils.remap(field.label, {}) as string}</label>
                        ) : null}
                        <div className="control">
                          <FieldComponent
                            field={field}
                            loading={loading}
                            onChange={onChange}
                            value={values[field.name]}
                          />
                        </div>
                      </div>
                    ),
                )}
              </ModalCard>
            </>
          ) : null}
        </div>
      </Form>
    );
  },
);
