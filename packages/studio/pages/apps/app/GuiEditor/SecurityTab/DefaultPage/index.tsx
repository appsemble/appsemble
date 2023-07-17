import { Button } from '@appsemble/react-components';
import { type MutableRefObject, type ReactElement, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode } from 'yaml';

import { messages } from './messages.js';
import { InputList } from '../../Components/InputList/index.js';
import { type tabChangeOptions } from '../index.js';

const policyOptions = ['everyone', 'organization', 'invite'] as const;

interface DefaultPageProps {
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
  onChangeTab: (tab: (typeof tabChangeOptions)[number]) => void;
}
export function DefaultPage({ changeIn, docRef, onChangeTab }: DefaultPageProps): ReactElement {
  const { formatMessage } = useIntl();

  const onChangeDefaultPolicy = useCallback(
    (index: number) => {
      changeIn(['security', 'default', 'policy'], docRef.current.createNode(policyOptions[index]));
    },
    [changeIn, docRef],
  );

  const onChangeDefaultRole = useCallback(
    (index: number) => {
      changeIn(
        ['security', 'default', 'role'],
        docRef.current.createNode(
          Object.entries(docRef.current.getIn(['security', 'roles']) || []).map(([key]) => key)[
            index
          ],
        ),
      );
    },
    [changeIn, docRef],
  );

  if (!docRef.current.getIn(['security', 'roles'])) {
    return (
      <>
        <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
        <Button className="is-primary" icon="add" onClick={() => onChangeTab('createRole')}>
          {formatMessage(messages.defaultCreateNewRole)}
        </Button>
      </>
    );
  }

  return (
    <>
      <InputList
        label={formatMessage(messages.defaultRoleLabel)}
        labelPosition="top"
        onChange={onChangeDefaultRole}
        options={Object.entries(docRef.current.getIn(['security', 'roles']) || []).map(
          ([key]) => key,
        )}
        value={(docRef.current.getIn(['security', 'default', 'role']) as string) || ''}
      />
      <InputList
        label={formatMessage(messages.defaultPolicyLabel)}
        labelPosition="top"
        onChange={onChangeDefaultPolicy}
        options={policyOptions}
        value={(docRef.current.getIn(['security', 'default', 'policy']) as string) || ''}
      />
    </>
  );
}
