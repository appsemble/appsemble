/**
 * Helper function to check whether a given date is on a weekend day.
 *
 * @param date - The date to check.
 * @returns Whether the given date is during a weekend.
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
