export function findMessageIds(obj: unknown, onMessage: (messageId: string) => void): void {
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
