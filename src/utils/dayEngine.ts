import type { DayId, IstanbulDateInfo } from '../types/studio';

const TURKISH_WEEKDAYS: Record<string, DayId> = {
  pazar: 0,
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
};

const DAY_NAMES_TR: Record<DayId, string> = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
};

/**
 * Returns the live date, weekday index (0=Pazar .. 6=Cumartesi), and YYYY-MM-DD key
 * strictly anchored to Europe/Istanbul (UTC+3).
 */
export function getIstanbulDateInfo(now: Date = new Date()): IstanbulDateInfo {
  const tz = 'Europe/Istanbul';

  const weekdayStr = new Intl.DateTimeFormat('tr-TR', {
    timeZone: tz,
    weekday: 'long',
  })
    .format(now)
    .toLocaleLowerCase('tr-TR');

  const dayId: DayId = TURKISH_WEEKDAYS[weekdayStr] ?? (now.getDay() as DayId);

  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    timeZone: tz,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';

  const timeText = new Intl.DateTimeFormat('tr-TR', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  return {
    dayId,
    dayName: DAY_NAMES_TR[dayId],
    formattedDate,
    dateKey: `${year}-${month}-${day}`,
    timeText,
  };
}
