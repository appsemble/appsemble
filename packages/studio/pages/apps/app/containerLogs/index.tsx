import {
  Button,
  Dropdown,
  Loader,
  LogEntryList,
  LogViewer,
  useMeta,
} from '@appsemble/react-components';
import { type LogObject } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../index.js';

export function ContainerLogs(): ReactNode {
  useMeta(messages.title);
  const { id } = useParams<{ id: string }>();
  const { app } = useApp();
  const [label, setLabel] = useState<string>(messages.selectContainer.defaultMessage);
  const [logs, setLogs] = useState<LogObject[]>();
  const [loading, setLoading] = useState(false);
  const containers = app.definition.containers ?? [];

  const handleSelectContainer = (containerName: string): void => {
    setLabel(containerName);
    setLoading(true);
    axios
      .get<LogObject[]>(`/api/containers/${id}/logs/${containerName}`)
      .then((res) => {
        setLogs(res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <Dropdown label={label}>
        {containers.map((c) => (
          <Button
            className="pl-5 dropdown-item"
            key={c.name}
            onClick={() => handleSelectContainer(c.name)}
          >
            {c.name}
          </Button>
        ))}
      </Dropdown>
      <div className={styles.wrapper}>
        {logs && logs.length > 0 ? (
          logs.map((object) => (
            <LogViewer
              key={String()}
              title={
                object.fromAppsemble
                  ? messages.appsembleServer.defaultMessage
                  : messages.containerLogs.defaultMessage
              }
            >
              {object.entries && object.entries.length > 0 ? (
                <LogEntryList entries={object.entries} />
              ) : (
                <FormattedMessage {...messages.noLogs} />
              )}
            </LogViewer>
          ))
        ) : (
          <FormattedMessage {...messages.noLogs} />
        )}
      </div>
    </>
  );
}
