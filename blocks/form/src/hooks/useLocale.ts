import flatpickr from 'flatpickr';
import { useMemo } from 'preact/hooks';

import { DateField, DateTimeField } from '../../block';

// The dawn of time was on a thursday
const weekdays = Array.from({ length: 7 }, (unused, index) => (index + 3) * 24 * 60 * 60 * 1000);

// It doesn’t matter which day in the month. Assuming months have 31 days works for this specific
// case.
const months = Array.from({ length: 12 }, (unused, index) => index * 31 * 24 * 60 * 60 * 1000);

export function useLocale({ startOfWeek = 1 }: DateField | DateTimeField): flatpickr.CustomLocale {
  return useMemo(() => {
    type Weekdays = flatpickr.CustomLocale['weekdays']['shorthand'];
    type Months = flatpickr.CustomLocale['months']['shorthand'];

    const { lang } = document.documentElement;
    const formatWeekdayLong = new Intl.DateTimeFormat(lang, { weekday: 'long' });
    const formatWeekdayShort = new Intl.DateTimeFormat(lang, { weekday: 'short' });
    const formatMonthLong = new Intl.DateTimeFormat(lang, { month: 'long' });
    const formatMonthShort = new Intl.DateTimeFormat(lang, { month: 'short' });

    return {
      firstDayOfWeek: startOfWeek,
      weekdays: {
        shorthand: weekdays.map((d) => formatWeekdayShort.format(d)) as Weekdays,
        longhand: weekdays.map((d) => formatWeekdayLong.format(d)) as Weekdays,
      },
      months: {
        shorthand: months.map((d) => formatMonthShort.format(d)) as Months,
        longhand: months.map((d) => formatMonthLong.format(d)) as Months,
      },
    };
  }, [startOfWeek]);
}
