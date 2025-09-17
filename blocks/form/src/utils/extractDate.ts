function pad(value: number, padding = 2): string {
  return String(value).padStart(padding, '0');
}

export function extractDate(date: Date | undefined): string | undefined {
  if (!date) {
    return;
  }
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
