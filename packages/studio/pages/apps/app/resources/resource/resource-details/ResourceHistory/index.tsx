import { Modal, useData, useToggle } from '@appsemble/react-components';
import { type ResourceVersion } from '@appsemble/types';
import { type ReactElement, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../../../components/AsyncDataView/index.js';
import { CodeBlock } from '../../../../../../../components/CodeBlock/index.js';
import { ListButton } from '../../../../../../../components/ListButton/index.js';

export function ResourceHistory(): ReactElement {
  const { id, resourceId, resourceName } = useParams<{
    id: string;
    resourceName: string;
    resourceId: string;
  }>();
  const result = useData<ResourceVersion[]>(
    `/api/apps/${id}/resources/${resourceName}/${resourceId}/history`,
  );

  const modal = useToggle();
  const [data, setData] = useState<string | undefined>();

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(versions) => (
        <>
          <ul>
            {versions.map((version) => (
              <ListButton
                icon="file-code"
                key={version.created}
                onClick={() => {
                  setData(JSON.stringify(version.data, undefined, 2));
                  modal.enable();
                }}
                subtitle={version.author?.name || version.author?.id}
                title={version.created}
              />
            ))}
          </ul>
          <Modal isActive={modal.enabled} onClose={modal.disable}>
            <CodeBlock language="json">{data}</CodeBlock>
          </Modal>
        </>
      )}
    </AsyncDataView>
  );
}
