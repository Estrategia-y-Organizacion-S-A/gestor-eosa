export function isHoliday(dateStr: string): { isHoliday: boolean; name?: string } {
  // dateStr is 'YYYY-MM-DD'
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const fixedHolidays: Record<string, string> = {
    '01-01': 'Año Nuevo',
    '01-06': 'Día de Reyes',
    '03-28': 'Reconquista de Vigo',
    '05-01': 'Día del Trabajador',
    '05-17': 'Día das Letras Galegas',
    '07-25': 'Día de Galicia',
    '08-15': 'Asunción de la Virgen',
    '08-16': 'San Roque (Vigo)',
    '10-12': 'Fiesta Nacional de España',
    '11-01': 'Todos los Santos',
    '12-06': 'Día de la Constitución',
    '12-08': 'Inmaculada Concepción',
    '12-24': 'Nochebuena (Empresa)',
    '12-25': 'Navidad',
    '12-31': 'Festivo de Empresa'
  };

  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  if (fixedHolidays[key]) {
    return { isHoliday: true, name: fixedHolidays[key] };
  }

  // Calculate Easter (Meeus/Jones/Butcher algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, easterMonth - 1, easterDay);
  
  const juevesSanto = new Date(easter);
  juevesSanto.setDate(easter.getDate() - 3);
  
  const viernesSanto = new Date(easter);
  viernesSanto.setDate(easter.getDate() - 2);

  const isSameDay = (d1: Date, m2: number, d2: number) => {
    return d1.getMonth() + 1 === m2 && d1.getDate() === d2;
  };

  if (isSameDay(juevesSanto, month, day)) {
    return { isHoliday: true, name: 'Jueves Santo' };
  }
  if (isSameDay(viernesSanto, month, day)) {
    return { isHoliday: true, name: 'Viernes Santo' };
  }

  return { isHoliday: false };
}
