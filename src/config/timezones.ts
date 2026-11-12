export type TimezoneGroup =
  | 'americas'
  | 'europe'
  | 'asia'
  | 'africa'
  | 'pacific'
  | 'utc';

export type TimezoneEntry = {
  value: string;
  labelEs: string;
  labelEn: string;
  group: TimezoneGroup;
};

export const TIMEZONES: TimezoneEntry[] = [
  { value: 'America/Anchorage', labelEs: 'Anchorage', labelEn: 'Anchorage', group: 'americas' },
  { value: 'America/Bogota', labelEs: 'Bogotá', labelEn: 'Bogota', group: 'americas' },
  { value: 'America/Argentina/Buenos_Aires', labelEs: 'Buenos Aires', labelEn: 'Buenos Aires', group: 'americas' },
  { value: 'America/Chicago', labelEs: 'Chicago', labelEn: 'Chicago', group: 'americas' },
  { value: 'America/Denver', labelEs: 'Denver', labelEn: 'Denver', group: 'americas' },
  { value: 'America/Los_Angeles', labelEs: 'Los Ángeles', labelEn: 'Los Angeles', group: 'americas' },
  { value: 'America/Mexico_City', labelEs: 'Ciudad de México', labelEn: 'Mexico City', group: 'americas' },
  { value: 'America/New_York', labelEs: 'Nueva York', labelEn: 'New York', group: 'americas' },
  { value: 'America/Santiago', labelEs: 'Santiago', labelEn: 'Santiago', group: 'americas' },
  { value: 'America/Sao_Paulo', labelEs: 'São Paulo', labelEn: 'São Paulo', group: 'americas' },
  { value: 'America/Toronto', labelEs: 'Toronto', labelEn: 'Toronto', group: 'americas' },
  { value: 'Africa/Cairo', labelEs: 'El Cairo', labelEn: 'Cairo', group: 'africa' },
  { value: 'Africa/Johannesburg', labelEs: 'Johannesburgo', labelEn: 'Johannesburg', group: 'africa' },
  { value: 'Africa/Lagos', labelEs: 'Lagos', labelEn: 'Lagos', group: 'africa' },
  { value: 'Africa/Nairobi', labelEs: 'Nairobi', labelEn: 'Nairobi', group: 'africa' },
  { value: 'Asia/Bangkok', labelEs: 'Bangkok', labelEn: 'Bangkok', group: 'asia' },
  { value: 'Asia/Dubai', labelEs: 'Dubái', labelEn: 'Dubai', group: 'asia' },
  { value: 'Asia/Hong_Kong', labelEs: 'Hong Kong', labelEn: 'Hong Kong', group: 'asia' },
  { value: 'Asia/Jakarta', labelEs: 'Yakarta', labelEn: 'Jakarta', group: 'asia' },
  { value: 'Asia/Kolkata', labelEs: 'Calcuta', labelEn: 'Kolkata', group: 'asia' },
  { value: 'Asia/Seoul', labelEs: 'Seúl', labelEn: 'Seoul', group: 'asia' },
  { value: 'Asia/Shanghai', labelEs: 'Shanghái', labelEn: 'Shanghai', group: 'asia' },
  { value: 'Asia/Singapore', labelEs: 'Singapur', labelEn: 'Singapore', group: 'asia' },
  { value: 'Asia/Tokyo', labelEs: 'Tokio', labelEn: 'Tokyo', group: 'asia' },
  { value: 'Europe/Amsterdam', labelEs: 'Ámsterdam', labelEn: 'Amsterdam', group: 'europe' },
  { value: 'Europe/Berlin', labelEs: 'Berlín', labelEn: 'Berlin', group: 'europe' },
  { value: 'Europe/Istanbul', labelEs: 'Estambul', labelEn: 'Istanbul', group: 'europe' },
  { value: 'Europe/London', labelEs: 'Londres', labelEn: 'London', group: 'europe' },
  { value: 'Europe/Madrid', labelEs: 'Madrid', labelEn: 'Madrid', group: 'europe' },
  { value: 'Europe/Moscow', labelEs: 'Moscú', labelEn: 'Moscow', group: 'europe' },
  { value: 'Europe/Paris', labelEs: 'París', labelEn: 'Paris', group: 'europe' },
  { value: 'Europe/Rome', labelEs: 'Roma', labelEn: 'Rome', group: 'europe' },
  { value: 'Pacific/Auckland', labelEs: 'Auckland', labelEn: 'Auckland', group: 'pacific' },
  { value: 'Pacific/Fiji', labelEs: 'Fiyi', labelEn: 'Fiji', group: 'pacific' },
  { value: 'Pacific/Honolulu', labelEs: 'Honolulu', labelEn: 'Honolulu', group: 'pacific' },
  { value: 'Pacific/Port_Moresby', labelEs: 'Port Moresby', labelEn: 'Port Moresby', group: 'pacific' },
  { value: 'UTC', labelEs: 'UTC', labelEn: 'UTC', group: 'utc' },
];

const GROUP_LABELS: Record<TimezoneGroup, { es: string; en: string }> = {
  americas: { es: 'América', en: 'Americas' },
  europe: { es: 'Europa', en: 'Europe' },
  asia: { es: 'Asia', en: 'Asia' },
  africa: { es: 'África', en: 'Africa' },
  pacific: { es: 'Pacífico', en: 'Pacific' },
  utc: { es: 'UTC', en: 'UTC' },
};

export function getTimezonesByGroup(locale: string) {
  const language = locale.toLowerCase().split('-')[0];
  const labelKey = language === 'es' ? 'labelEs' : 'labelEn';
  const groupLabelKey = language === 'es' ? 'es' : 'en';
  const groups: TimezoneGroup[] = [
    'americas',
    'europe',
    'asia',
    'africa',
    'pacific',
    'utc',
  ];

  return groups.map((group) => ({
    group,
    label: GROUP_LABELS[group][groupLabelKey],
    options: TIMEZONES.filter((timezone) => timezone.group === group)
      .slice()
      .sort((a, b) => a.labelEs.localeCompare(b.labelEs))
      .map((timezone) => ({
        value: timezone.value,
        label: timezone[labelKey],
      })),
  }));
}

export function isTimezoneInCatalog(value: string): boolean {
  return TIMEZONES.some((timezone) => timezone.value === value);
}
