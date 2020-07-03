import { bootstrap } from '@appsemble/preact';
import { Button, Form, Modal, useToggle } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, h } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import type { FilterValue, FilterValues } from '../block';
import FieldComponent from './components/FieldComponent';
import styles from './index.css';

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

    const onChange = useCallback(
      (event: h.JSX.TargetedEvent<HTMLInputElement | HTMLButtonElement>, value: FilterValue) => {
        setValues({
          ...values,
          [event.currentTarget.name]: value,
        });
      },
      [values],
    );

    const onSubmit = useCallback(async () => {
      setLoading(true);
      try {
        const data = await actions.onLoad.dispatch();
        events.emit.data(data);
      } catch (error) {
        events.emit.data(null, error);
      }
      setLoading(false);
    }, [actions, events]);

    const resetFilter = useCallback(() => {
      setValues(defaultValues);
    }, [defaultValues]);

    useEffect(ready, [ready]);

    useEffect(() => {
      onSubmit();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Form
        className={classNames(`is-flex mb-1 ${styles.root}`, {
          [styles.highlighted]: highlightedField,
        })}
        onSubmit={onSubmit}
      >
        {highlightedField && (
          <FieldComponent
            field={highlightedField}
            highlight
            loading={loading}
            onChange={onChange}
            value={values[highlightedField.name]}
          />
        )}
        <Button
          className={classNames('mx-2 my-2', { 'is-primary': true })}
          icon="filter"
          loading={loading}
          onClick={modal.enable}
        />
        <Modal
          footer={
            <Fragment>
              <Button className="card-footer-item" onClick={resetFilter}>
                {utils.remap(clearLabel, {})}
              </Button>
              <Button className="card-footer-item" color="primary" type="submit">
                {utils.remap(submitLabel, {})}
              </Button>
            </Fragment>
          }
          isActive={modal.enabled}
          onClose={modal.disable}
          title={utils.remap(modalTitle, {})}
        >
          {fields.map(
            (field) =>
              field === highlightedField || (
                <FieldComponent
                  field={field}
                  loading={loading}
                  onChange={onChange}
                  value={values[field.name]}
                />
              ),
          )}
        </Modal>
      </Form>
    );
  },
);
