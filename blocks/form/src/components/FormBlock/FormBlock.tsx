/** @jsx h */
import { BlockProps } from '@appsemble/preact';
import classNames from 'classnames';
import { Component, h, VNode } from 'preact';

import { Actions, Parameters } from '../../../block';
import BooleanInput from '../BooleanInput';
import EnumInput from '../EnumInput';
import FileInput from '../FileInput';
import GeoCoordinatesInput from '../GeoCoordinatesInput';
import NumberInput from '../NumberInput';
import StringInput from '../StringInput';
import styles from './FormBlock.css';
import messages from './messages';

type FormBlockProps = BlockProps<Parameters, Actions>;

type Values = Record<string, any>;

interface FormBlockState {
  errors: {
    [name: string]: string;
  };
  pristine: boolean;
  submitting: boolean;
  values: Values;
}

const inputs = {
  file: FileInput,
  geocoordinates: GeoCoordinatesInput,
  hidden: (): null => null,
  string: StringInput,
  number: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
  bool: BooleanInput,
};

/**
 * Render Material UI based a form based on a JSON schema
 */
export default class FormBlock extends Component<FormBlockProps, FormBlockState> {
  state: FormBlockState = {
    errors: {},
    pristine: true,
    submitting: false,
    values: {
      ...this.props.block.parameters.fields.reduce<Values>(
        (acc, { name, defaultValue, repeated }) => {
          acc[name] = defaultValue || (repeated && []);
          return acc;
        },
        {},
      ),
      ...this.props.data,
    },
  };

  onChange = (event: Event, value: any) => {
    this.setState(({ values }) => ({
      pristine: false,
      values: {
        ...values,
        [(event.target as HTMLInputElement).name]: value,
      },
    }));
  };

  onSubmit = (event: Event) => {
    event.preventDefault();

    this.setState(({ submitting, values }, { actions }) => {
      if (!submitting) {
        actions.onSubmit
          .dispatch(values)
          .then(() => {
            this.setState({
              submitting: false,
            });
            return actions.onSubmitSuccess.dispatch(values);
          })
          .catch(error => {
            if (error.message !== 'Schema Validation Failed') {
              this.setState({
                submitting: false,
              });
              throw error;
            }
            this.setState({
              errors: error.data,
              submitting: false,
            });
          });
      }
      return {
        submitting: true,
      };
    });
  };

  render(): VNode {
    const { block } = this.props;
    const { errors, pristine, submitting, values } = this.state;

    return (
      <form className={styles.root} noValidate onSubmit={this.onSubmit}>
        {block.parameters.fields.map(field => {
          if (field.enum) {
            return (
              <EnumInput
                key={field.name}
                error={errors[field.name]}
                field={field}
                onChange={this.onChange}
                value={values[field.name]}
              />
            );
          }
          if (!Object.prototype.hasOwnProperty.call(inputs, field.type)) {
            return messages.unsupported;
          }
          const Comp = inputs[field.type];
          return (
            <Comp
              key={field.name}
              error={errors[field.name]}
              field={field}
              onChange={this.onChange}
              value={values[field.name]}
            />
          );
        })}
        <div className={styles.buttonWrapper}>
          <button
            className={classNames('button', 'is-primary', styles.submit)}
            disabled={pristine || submitting || Object.keys(errors).length !== 0}
            type="submit"
          >
            {messages.submit}
          </button>
        </div>
      </form>
    );
  }
}
