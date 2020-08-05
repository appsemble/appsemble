import type { Remapper } from '@appsemble/types';

export default function findMessageIds(
  obj: object | Remapper,
  onMessage: (messageId: string) => void,
): void {
  if (!obj) {
    return;
  }
  Object.entries(obj).forEach(([key, value]) => {
    if (key === 'string.format' && value.messageId) {
      onMessage(value.messageId);
    } else if (typeof value === 'object') {
      findMessageIds(value, onMessage);
    }
  });
}
