import { type IntlShape } from 'react-intl';

import { messages as editorMessages } from './edit/messages.js';

export interface ResourceUniqueConstraintErrorData {
  code?: string;
  field?: string;
  fields?: string[];
  resourceType?: string;
}

export function formatResourceUniqueConstraintAppError(
  formatMessage: IntlShape['formatMessage'],
  data: ResourceUniqueConstraintErrorData | undefined,
): string | undefined {
  if (
    data?.code === 'RESOURCE_UNIQUE_CONSTRAINT_CONFLICT' &&
    data.resourceType &&
    Array.isArray(data.fields) &&
    data.fields.length
  ) {
    return formatMessage(editorMessages.uniqueConstraintConflict, {
      fields: data.fields.map((field) => `“${field}”`).join(', '),
      resourceType: `“${data.resourceType}”`,
    });
  }

  if (
    data?.code === 'RESOURCE_UNIQUE_CONSTRAINT_VALUE_ERROR' &&
    data.resourceType &&
    typeof data.field === 'string'
  ) {
    return formatMessage(editorMessages.uniqueConstraintInvalidValue, {
      field: `“${data.field}”`,
      resourceType: `“${data.resourceType}”`,
    });
  }

  return undefined;
}
