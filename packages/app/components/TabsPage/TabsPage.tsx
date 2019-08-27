import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { Link, Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import BlockList, { BlockListProps } from '../BlockList';

interface TabsPageProps {
  subPages: any[];
}

export default class TabsPage extends React.Component<
  TabsPageProps & BlockListProps & RouteComponentProps<{ subPage: string }>
> {
  render(): ReactNode {
    const { subPages, match, ...blockListProps } = this.props;

    return (
      <>
        <div className="tabs is-centered is-medium">
          <ul>
            {subPages.map(({ name }) => (
              <li
                key={name}
                className={classNames({
                  'is-active': normalize(name) === match.params.subPage,
                })}
              >
                <Link to={`${normalize(name)}`}>{name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <Switch>
          {subPages.map(({ name, blocks }) => (
            <Route
              key={name}
              exact
              path={`${match.path}/${normalize(name)}`}
              render={() => <BlockList {...blockListProps} blocks={blocks} />}
            />
          ))}

          <Redirect to={`${match.url}/${normalize(subPages[0].name)}`} />
        </Switch>
      </>
    );
  }
}
