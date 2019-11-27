import { BlockProps } from '@appsemble/react';
import { Modal } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Actions, Filter, Parameters, RangeFilter } from '../../../types';
import toOData from '../../utils/toOData';
import Field from '../Field';
import styles from './FilterBlock.css';
import messages from './messages';

interface FilterBlockState {
  currentFilter?: Filter;
  filter?: Filter;
  data?: any;
  newData?: any[];
  isOpen?: boolean;
  loading?: boolean;
  lastRefreshedDate?: Date;
  typingTimer?: NodeJS.Timeout;
}

export type FilterBlockProps = BlockProps<Parameters, Actions>;

export default class FilterBlock extends React.Component<FilterBlockProps, FilterBlockState> {
  refreshTimer: NodeJS.Timeout = null;

  state: FilterBlockState = {
    lastRefreshedDate: undefined,
    newData: [],
    data: [],
    currentFilter: {},
    filter: {},
    loading: false,
    isOpen: false,
  };

  async componentDidMount(): Promise<void> {
    const {
      block: {
        parameters: { refreshTimeout },
      },
    } = this.props;

    this.resetFilter();

    if (refreshTimeout) {
      this.refreshTimer = setInterval(this.onRefresh, refreshTimeout * 1000);
    }
  }

  componentWillUnmount(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  fetchData = (filterParams?: Filter): Promise<any> => {
    const {
      actions,
      block: {
        parameters: { fields },
      },
    } = this.props;

    const { filter } = this.state;

    // Convert date fields to unix timestamps without mutating filter itself
    const convertedFilter = Object.entries(filter).reduce<Filter>((acc, [key, value]) => {
      const field = fields.find(f => f.name === key);
      if (field.type && field.type === 'date') {
        if (field.range) {
          acc[key] = {};
          if ((value as RangeFilter).to) {
            (acc[key] as RangeFilter).to = new Date((value as RangeFilter).to).getTime();
          }

          if ((value as RangeFilter).from) {
            (acc[key] as RangeFilter).from = new Date((value as RangeFilter).from).getTime();
          }
        } else {
          acc[key] = new Date(value as string).getTime();
        }
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});

    const $filter = toOData(fields, { ...convertedFilter, ...filterParams });

    return actions.onLoad.dispatch({
      ...($filter && { $filter }),
    });
  };

  resetFilter = (e?: React.MouseEvent<HTMLButtonElement>): void => {
    const {
      events,
      block: {
        parameters: { event, fields },
      },
    } = this.props;

    if (e && (e.target as HTMLButtonElement).disabled) {
      return;
    }

    const defaultFilter = fields.reduce<Filter>((acc, { name, defaultValue, type }) => {
      if (defaultValue) {
        acc[name] = defaultValue;
      } else if (type === 'checkbox') {
        acc[name] = [];
      }

      return acc;
    }, {});

    this.setState({ currentFilter: defaultFilter, filter: defaultFilter }, async () => {
      const data = await this.fetchData();
      events.emit(event, data);
      this.setState({ data, newData: [] });
    });
  };

  onRefresh = async (): Promise<void> => {
    const { lastRefreshedDate = new Date(), newData } = this.state;
    const refreshDate = new Date();

    const fetchedItems = await this.fetchData({ $created: { from: lastRefreshedDate.getTime() } });

    this.setState({ lastRefreshedDate: refreshDate, newData: [...fetchedItems, ...newData] });
  };

  onDismissRefresh = (): void => {
    this.setState({ newData: [] });
  };

  onMergeRefresh = (): void => {
    const { newData, data } = this.state;
    const {
      events,
      block: {
        parameters: { event },
      },
    } = this.props;

    const updatedData = [...newData, ...data];

    events.emit(event, updatedData);
    this.setState({ newData: [], data: updatedData });
  };

  onChange = ({ target }: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState(
      (
        { filter, typingTimer },
        {
          block: {
            parameters: { fields, highlight },
          },
        },
      ) => {
        const newFilter = {
          ...filter,
          [target.name]: target.value,
        };
        if (highlight && target.name === highlight) {
          if (!fields.find(field => field.name === highlight).enum) {
            // wait 300ms, then submit
            clearTimeout(typingTimer);

            return {
              filter: newFilter,
              typingTimer: setTimeout(this.onFilter, 300),
            };
          }
          setTimeout(this.onFilter, 0);
        }
        return { filter: newFilter };
      },
    );
  };

  onCheckBoxChange = async ({
    target: { name, checked, value },
  }: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    this.setState(({ filter }) => {
      const entry = (filter[name] as string[]) || [];
      if (checked) {
        if (entry.includes(value)) {
          return null;
        }

        return {
          filter: {
            ...filter,
            [name]: [...entry, value],
          },
        };
      }
      return {
        filter: {
          ...filter,
          [name]: entry.filter(e => e !== value),
        },
      };
    });
  };

  onRangeChange = ({ target: { id, name, value } }: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState(({ filter }) => {
      return {
        filter: {
          ...filter,
          [name]: {
            ...(filter[name] as {}),
            [id.startsWith('to') ? 'to' : 'from']: value,
          },
        },
      };
    });
  };

  onFilter = async (): Promise<void> => {
    const {
      block: {
        parameters: { event },
      },
      events,
    } = this.props;

    this.setState({ loading: true });

    const data = await this.fetchData();
    events.emit(event, data);

    this.setState(({ filter }) => ({
      loading: false,
      isOpen: false,
      currentFilter: filter,
      data,
      newData: [],
    }));
  };

  onOpen = (): void => {
    this.setState({ isOpen: true });
  };

  onClose = (): void => {
    this.setState({ isOpen: false });
  };

  onFilterKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.onClose();
    }
  };

  render(): JSX.Element {
    const { block } = this.props;
    const { currentFilter, filter, isOpen, loading, newData } = this.state;
    const { fields, highlight } = block.parameters;
    const highlightedField = highlight && fields.find(field => field.name === highlight);
    const showModal = !highlightedField || fields.length > 1;

    // check if filter has any field set that isn't already highlighted or its default value
    const activeFilters = Object.entries(currentFilter).some(([key, value]) => {
      if (value == null) {
        return false;
      }

      const field = fields.find(f => f.name === key);
      return field && field.defaultValue !== undefined ? field.defaultValue === value : true;
    });

    return (
      <>
        <div className={styles.container}>
          <Modal
            isActive={isOpen}
            onClose={this.onClose}
            title={<FormattedMessage {...messages.filter} />}
          >
            {fields
              .filter(field => field.name !== highlight)
              .map(field => (
                <Field
                  {...field}
                  key={field.name}
                  filter={filter}
                  loading={loading}
                  onChange={this.onChange}
                  onCheckBoxChange={this.onCheckBoxChange}
                  onRangeChange={this.onRangeChange}
                />
              ))}
            <footer className="card-footer">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                className="card-footer-item is-link"
                onClick={this.onClose}
                onKeyDown={this.onFilterKeyDown}
                role="button"
                tabIndex={-1}
              >
                <FormattedMessage {...messages.cancel} />
              </a>
              <button
                className={`card-footer-item button is-primary ${styles.cardFooterButton}`}
                onClick={this.onFilter}
                type="button"
              >
                <FormattedMessage {...messages.filter} />
              </button>
            </footer>
          </Modal>
          {highlightedField && (
            <div className={styles.highlighted}>
              <Field
                {...highlightedField}
                displayLabel={!!highlightedField.label}
                filter={filter}
                loading={loading}
                onChange={this.onChange}
                onRangeChange={this.onRangeChange}
              />
            </div>
          )}
          {showModal && (
            <>
              <button
                className={classNames('button', styles.filterDialogButton)}
                disabled={!activeFilters}
                onClick={activeFilters && this.resetFilter}
                type="button"
              >
                <span className="icon">
                  <i className="fas fa-ban has-text-danger" />
                </span>
              </button>
              <button
                className={classNames('button', styles.filterDialogButton, {
                  'is-primary': activeFilters,
                })}
                onClick={this.onOpen}
                type="button"
              >
                <span className="icon">
                  <i className="fas fa-filter" />
                </span>
              </button>
            </>
          )}
        </div>
        {newData.length > 0 && (
          <article className={`message ${styles.newDataBar}`}>
            <div className="message-header">
              <button className={styles.newDataButton} onClick={this.onMergeRefresh} type="button">
                <FormattedMessage {...messages.refreshData} values={{ amount: newData.length }} />
              </button>
              <button
                aria-label="delete"
                className="delete"
                onClick={this.onDismissRefresh}
                type="button"
              />
            </div>
          </article>
        )}
      </>
    );
  }
}
