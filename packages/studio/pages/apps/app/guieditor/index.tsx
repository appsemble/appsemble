import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function EditPage(): ReactElement {
  useMeta('GUI Editor');
  const location = useLocation();

  const tabs = ['#general', '#resources', '#pages', '#theme', '#security'];

  if (!location.hash || !tabs.includes(location.hash)) {
    return <Navigate to={{ ...location, hash: '#pages' }} />;
  }

  return (
    <div className="container">
      <div className="tabs is-boxed is-fullwidth">
        <ul>
          <li className={location.hash === '#general' ? 'is-active' : undefined}>
            <a href="#general">General</a>
          </li>
          <li className={location.hash === '#resources' ? 'is-active' : undefined}>
            <a href="#resources">Resources</a>
          </li>
          <li className={location.hash === '#pages' ? 'is-active' : undefined}>
            <a href="#pages">Pages</a>
          </li>
          <li className={location.hash === '#theme' ? 'is-active' : undefined}>
            <a href="#theme">Theme</a>
          </li>
          <li className={location.hash === '#security' ? 'is-active' : undefined}>
            <a href="#security">Security</a>
          </li>
        </ul>
      </div>
      <div className="box">{location.hash}</div>
    </div>
  );
}
