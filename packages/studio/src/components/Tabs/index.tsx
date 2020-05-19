import classNames from 'classnames';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Tabs(): React.ReactElement {
  const location = useLocation();

  return (
    <div className="tabs is-medium is-centered">
      <ul>
        <li className={classNames({ 'is-active': location.pathname.startsWith('/apps') })}>
          <Link to="/apps">Apps</Link>
        </li>
        <li className={classNames({ 'is-active': location.pathname.startsWith('/blocks') })}>
          <Link to="/blocks">Blocks</Link>
        </li>
      </ul>
    </div>
  );
}
