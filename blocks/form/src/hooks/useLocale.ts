import { months, weekdays } from '@appsemble/utils';
import flatpickr from 'flatpickr';
import { useMemo } from 'preact/hooks';

import { DateField, DateTimeField } from '../../block.js';

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
