import { Button, useMessages } from '@appsemble/react-components';
import { type RoleDefinition } from '@appsemble/types';
import {
  type ChangeEvent,
  type MutableRefObject,
  type ReactElement,
  useCallback,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { type Document, type Node, type ParsedNode, type YAMLSeq } from 'yaml';

import { messages } from './messages.js';
import { InputList } from '../../Components/InputList/index.js';
import { InputString } from '../../Components/InputString/index.js';
import { InputTextArea } from '../../Components/InputTextArea/index.js';
import { OptionalList } from '../../Components/OptionalList/index.js';

interface CreateRolePageProps {
  changeIn: (path: Iterable<unknown>, value: Node) => void;
  docRef: MutableRefObject<Document<ParsedNode>>;
}

export function CreateRolePage({ changeIn, docRef }: CreateRolePageProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [createRoleName, setCreateRoleName] = useState<string>('');
  const [createRoleDescription, setCreateRoleDescription] = useState<string>('');
  const [createRoleInherits, setCreateRoleInherits] = useState<string[]>([]);
  const [createRoleDefaultPage, setCreateRoleDefaultPage] = useState<string>(null);

  const onCreateRoleName = useCallback((event: ChangeEvent<HTMLInputElement>, input: string) => {
    setCreateRoleName(input);
  }, []);

  const onCreateRoleDefaultPage = useCallback(
    (pageNr: number) => {
      if (pageNr === 0) {
        setCreateRoleDefaultPage(null);
      } else {
        setCreateRoleDefaultPage(docRef.current.getIn(['pages', pageNr - 1, 'name']) as string);
      }
    },
    [docRef],
  );

  const onChangeInheritance = useCallback(
    (selectedRoles: string[]) => {
      setCreateRoleInherits([...selectedRoles]);
    },
    [setCreateRoleInherits],
  );

  const onCreateRoleDescription = useCallback((input: string) => {
    setCreateRoleDescription(input);
  }, []);

  const onRoleCreate = useCallback(() => {
    const doc = docRef.current;
    if (!createRoleName || createRoleName.trim() === '') {
      push({ body: formatMessage(messages.roleNameMissing), color: 'danger' });
      return;
    }
    if (doc.getIn(['security', 'roles', createRoleName])) {
      push({ body: formatMessage(messages.roleAlreadyExists), color: 'danger' });
      return;
    }
    const newRole: RoleDefinition = {
      ...(createRoleDescription.trim() !== '' && { description: createRoleDescription }),
      ...(createRoleInherits.length > 0 && { inherits: createRoleInherits }),
      ...(createRoleDefaultPage && { defaultPage: createRoleDefaultPage }),
    };
    changeIn(['security', 'roles', createRoleName], doc.createNode(newRole));
    push({ body: formatMessage(messages.roleCreated), color: 'success' });
    setCreateRoleDefaultPage(null);
    setCreateRoleDescription('');
    setCreateRoleInherits([]);
    setCreateRoleName('');
  }, [
    changeIn,
    createRoleDefaultPage,
    createRoleDescription,
    createRoleInherits,
    createRoleName,
    docRef,
    formatMessage,
    push,
  ]);

  return (
    <>
      <InputString
        label={formatMessage(messages.roleNameLabel)}
        maxLength={40}
        minLength={1}
        onChange={onCreateRoleName}
        pattern={/[A-z]+[\dA-z]*/}
        value={createRoleName}
      />
      <InputList
        label={formatMessage(messages.defaultPageLabel)}
        labelPosition="top"
        onChange={(pageNr) => onCreateRoleDefaultPage(pageNr)}
        options={[formatMessage(messages.noneLabel)].concat(
          (docRef.current.getIn(['pages']) as YAMLSeq).items.map((option: any) =>
            option.getIn(['name']),
          ),
        )}
        value={createRoleDefaultPage || formatMessage(messages.noneLabel)}
      />
      <InputTextArea
        allowSymbols
        label={formatMessage(messages.roleDescriptionLabel)}
        maxLength={80}
        minLength={0}
        onChange={(event, value) => onCreateRoleDescription(value)}
        value={createRoleDescription}
      />
      {Object.entries(docRef.current.getIn(['security', 'roles']) || []).length > 0 && (
        <OptionalList
          addNewItemLabel={formatMessage(messages.addInheritanceLabel)}
          label={formatMessage(messages.inheritsLabel)}
          labelPosition="top"
          onNewSelected={onChangeInheritance}
          options={Object.entries(docRef.current.getIn(['security', 'roles']) || [])
            .map(([key]) => key)
            .filter((role) => !createRoleInherits.includes(role))}
          selected={createRoleInherits}
        />
      )}
      <Button color="primary" onClick={onRoleCreate}>
        {formatMessage(messages.createRoleButton)}
      </Button>
    </>
  );
}
