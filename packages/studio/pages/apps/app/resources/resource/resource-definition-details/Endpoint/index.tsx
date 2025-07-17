import { generateDataFromSchema, getAppRolesByPermissions } from '@appsemble/lang-sdk';
import { Title } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { useApp } from '../../../../index.js';

interface EndpointProps {
  readonly hasBody?: boolean;
  readonly type: '$count' | 'create' | 'delete' | 'get' | 'query' | 'update';
}

/**
 * Pass along the resource name from the GUI editor `Resources` tab
 */
interface Props {
  readonly guiResourceName?: string;
}

interface CombinedProps extends EndpointProps, Props {}

const methods = {
  get: ['GET', 'id'],
  query: ['GET', ''],
  $count: ['GET', '$count'],
  create: ['POST', 'id'],
  update: ['PUT', 'id'],
  delete: ['DELETE', 'id'],
};

export function Endpoint({ guiResourceName, hasBody, type }: CombinedProps): ReactNode {
  const { app } = useApp();
  const { resourceName: paramResourceName } = useParams<{ resourceName: string }>();
  const resourceName: string = guiResourceName || paramResourceName;
  const resource = app.definition.resources[resourceName];

  const roles = getAppRolesByPermissions(app.definition.security, [
    `$resource:${resourceName}:${type === '$count' ? 'query' : type}`,
  ]);

  const [method, postfix] = methods[type];

  return (
    <div>
      <Title className="is-inline mr-2" size={5}>
        <FormattedMessage {...messages[type]} values={{ resourceName }} />
      </Title>
      <div className="is-inline">
        {roles.includes('Guest') ? (
          <span className="tag is-warning">
            <FormattedMessage {...messages.guest} />
          </span>
        ) : (
          roles.map((role) => (
            <span className="tag is-success mr-1" key={role}>
              <FormattedMessage {...messages.role} values={{ role }} />
            </span>
          ))
        )}
      </div>
      <pre className="my-4">
        <code>
          <span className="has-text-weight-bold">{method} </span>
          <span>{`${window.location.origin}/api/apps/${app.id}/resources/${resourceName}`}</span>
          {postfix ? (
            <>
              <span>/</span>
              {type === '$count' ? (
                postfix
              ) : (
                <span className="has-text-weight-bold has-text-danger">{postfix}</span>
              )}
            </>
          ) : null}
          <span>
            {` HTTP/1.1
Accept: application/json
Authorization: Bearer `}
          </span>
          <span className="has-text-weight-bold has-text-danger">access_token</span>
          {hasBody ? (
            <span>
              {`\n\n${JSON.stringify(generateDataFromSchema(resource.schema), undefined, 2)}`}
            </span>
          ) : null}
        </code>
      </pre>
    </div>
  );
}
