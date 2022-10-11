import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function EditPage(): ReactElement {
  useMeta('GUI Editor');
  const location = useLocation();

  const tabs = [
    {
      title: 'General',
      hash: '#general',
      name: 'general',
    },
    {
      title: 'Resources',
      hash: '#resources',
      name: 'resources',
    },
    {
      title: 'Pages',
      hash: '#pages',
      name: 'pages',
    },
    {
      title: 'Theme',
      hash: '#theme',
      name: 'theme',
    },
    {
      title: 'Security',
      hash: '#security',
      name: 'security',
    },
  ];

  if (!location.hash || !tabs.some((tab) => tab.hash === location.hash)) {
    return <Navigate to={{ ...location, hash: '#pages' }} />;
  }

  return (
    <div className="container">
      <div className="tabs is-boxed is-fullwidth">
        <ul>
          {tabs.map((tab) => (
            <li className={tab.hash === location.hash ? 'is-active' : ''} key={tab.name}>
              <a href={tab.hash}>{tab.title}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="box">{location.hash}</div>
    </div>
  );
}
