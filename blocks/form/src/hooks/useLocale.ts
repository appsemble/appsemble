import { months, weekdays } from '@appsemble/utils';
import type flatpickr from 'flatpickr';
import { useMemo } from 'preact/hooks';

import { type DateField, type DateTimeField } from '../../block.js';

export function useLocale({
  startOfWeek = 1,
}: DateField | DateTimeField): flatpickr.default.CustomLocale {
  return useMemo(() => {
    type Weekdays = flatpickr.default.CustomLocale['weekdays']['shorthand'];
    type Months = flatpickr.default.CustomLocale['months']['shorthand'];

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
