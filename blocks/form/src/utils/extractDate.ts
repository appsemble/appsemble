function pad(value: number, padding = 2): string {
  return String(value).padStart(padding, '0');
}

export function extractDate(date: Date | undefined): string | undefined {
  if (!date) {
    return;
  }
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function extractDateBoundary(
  date: Date | undefined,
  boundary: 'start' | 'end',
): string | undefined {
  if (!date) {
    return;
  }

  const result = new Date(date);
  if (boundary === 'start') {
    result.setHours(0, 0, 0, 0);
  } else {
    result.setHours(23, 59, 59, 999);
  }
  return result.toISOString();
}
