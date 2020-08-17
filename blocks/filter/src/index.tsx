import { bootstrap } from '@appsemble/preact';
import { Button, CardFooterButton, Form, Modal, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, h } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import type { FilterValue, FilterValues } from '../block';
import { FieldComponent } from './components/FieldComponent';
import styles from './index.css';
import { toOData } from './utils/toOData';

bootstrap(
  ({
    actions,
    events,
    parameters: {
      clearLabel = 'Clear',
      fields,
      highlight,
      modalTitle = 'Filter',
      submitLabel = 'Filter',
    },
    ready,
    utils,
  }) => {
    const modal = useToggle();
    const [loading, setLoading] = useState(false);
    const defaultValues = useMemo(
      () =>
        fields.reduce((acc, { defaultValue, name, type }) => {
          if (defaultValue != null) {
            acc[name] = defaultValue;
          } else if (type === 'buttons' || type === 'date-range') {
            acc[name] = [];
          } else {
            acc[name] = null;
          }
          return acc;
        }, {} as FilterValues),
      [fields],
    );
    const [values, setValues] = useState(defaultValues);

    const highlightedField = fields.find((field) => field.name === highlight);

    const fetchData = useCallback(
      async (submitValues: FilterValues) => {
        setLoading(true);
        try {
          const data = await actions.onLoad.dispatch({ $filter: toOData(fields, submitValues) });
          events.emit.filtered(data);
        } catch (error) {
          events.emit.filtered(null, error);
        }
        setLoading(false);
      },
      [actions, events, fields],
    );

    const onChange = useCallback(
      (
        { currentTarget: { name } }: h.JSX.TargetedEvent<HTMLInputElement | HTMLButtonElement>,
        value: FilterValue,
      ) => {
        const newValues = {
          ...values,
          [name]: value,
        };
        setValues(newValues);
        if (name === highlight) {
          fetchData(newValues);
        }
      },
      [fetchData, highlight, values],
    );

    const onSubmit = useCallback(() => fetchData(values).then(modal.disable), [
      fetchData,
      modal,
      values,
    ]);

    const resetFilter = useCallback(() => {
      setValues(defaultValues);
      return fetchData(defaultValues);
    }, [defaultValues, fetchData]);

    useEffect(() => {
      const refresh = async (): Promise<void> => {
        try {
          const data = await actions.onLoad.dispatch({ $filter: toOData(fields, values) });
          events.emit.refreshed(data);
        } catch (error) {
          events.emit.refreshed(null, error);
        }
      };

      events.on.refresh(refresh);

      return () => events.off.refresh(refresh);
    }, [actions, events, fields, values]);

    useEffect(ready, [ready]);

    useEffect(() => {
      // Load the initial data when the block is rendered.
      onSubmit();
      // This should only be called once, so `onSubmit` should not be in the dependency array.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showModal = fields.some((field) => field.name !== highlight);

    return (
      <Form
        className={classNames(`is-flex mb-1 ${styles.root}`, {
          [styles.highlighted]: highlightedField,
        })}
        onSubmit={onSubmit}
      >
        {highlightedField && (
          <FieldComponent
            className="mx-2 my-2"
            field={highlightedField}
            highlight
            loading={loading}
            onChange={onChange}
            value={values[highlightedField.name]}
          />
        )}
        {showModal && (
          <Fragment>
            <Button
              className={classNames('mx-2 my-2', { 'is-primary': true })}
              icon="filter"
              loading={loading}
              onClick={modal.enable}
            />
            <Modal
              footer={
                <Fragment>
                  <CardFooterButton onClick={resetFilter}>
                    {utils.remap(clearLabel, {})}
                  </CardFooterButton>
                  <CardFooterButton color="primary" type="submit">
                    {utils.remap(submitLabel, {})}
                  </CardFooterButton>
                </Fragment>
              }
              isActive={modal.enabled}
              onClose={modal.disable}
              title={utils.remap(modalTitle, {})}
            >
              {fields.map(
                (field) =>
                  field === highlightedField || (
                    <div className="field">
                      {field.label && (
                        <label className="label">{utils.remap(field.label, {})}</label>
                      )}
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
            </Modal>
          </Fragment>
        )}
      </Form>
    );
  },
);
