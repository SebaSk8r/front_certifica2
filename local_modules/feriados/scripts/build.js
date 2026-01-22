"use strict";

const jsesc = require("jsesc");

// https://github.com/devschile/feriados-cl/blob/main/functions/holidays.js

function easterSunday(year) {
  // Anonymous Gregorian algorithm (Meeus/Jones)
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatHoliday(date, descripcion, tipo, irrenunciable) {
  return {
    date: date,
    descripcion,
    tipo,
    irrenunciable: !!irrenunciable,
  };
}

function buildHolidays(year) {
  const holidays = [];

  // Fixed-date holidays
  holidays.push(formatHoliday(new Date(Date.UTC(year, 0, 1)), "Año Nuevo", "civil", true));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 4, 1)), "Día del Trabajo", "civil", true));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 4, 21)), "Día de las Glorias Navales", "civil", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 5, 21)), "Día Nacional de los Pueblos Indígenas", "civil", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 6, 16)), "Día de la Virgen del Carmen", "religioso", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 7, 15)), "Asunción de la Virgen", "religioso", false));
  //holidays.push(formatHoliday(new Date(Date.UTC(year, 8, 17)), "Feriado Adicional Fiestas Patrias", "civil", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 8, 18)), "Independencia Nacional", "civil", true));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 8, 19)), "Día de las Glorias del Ejército", "civil", true));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 9, 31)), "Día de las Iglesias Evangélicas y Protestantes", "religioso", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 10, 1)), "Día de Todos los Santos", "religioso", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 11, 8)), "Inmaculada Concepción", "religioso", false));
  holidays.push(formatHoliday(new Date(Date.UTC(year, 11, 25)), "Navidad", "religioso", true));

  // Movable: Easter-related (Good Friday, Holy Saturday)
  const easter = easterSunday(year); // Easter Sunday UTC
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(easter.getUTCDate() - 2);
  const holySaturday = new Date(easter);
  holySaturday.setUTCDate(easter.getUTCDate() - 1);

  holidays.push(formatHoliday(goodFriday, "Viernes Santo", "religioso", false));
  holidays.push(formatHoliday(holySaturday, "Sábado Santo", "religioso", false));

  // Movibles:
  // Encuentro de dos Mundos
  const encuentroDosMundos = new Date(Date.UTC(year, 9, 12));
  const dayOfWeek = encuentroDosMundos.getUTCDay();
  if (dayOfWeek !== 1) {
    // If not Monday, move to next Monday
    const daysToAdd = (8 - dayOfWeek) % 7;
    encuentroDosMundos.setUTCDate(encuentroDosMundos.getUTCDate() + daysToAdd);
  }
  holidays.push(formatHoliday(encuentroDosMundos, "Encuentro de Dos Mundos", "civil", false));

  // San Pedro y San Pablo
  // Lunes, Sabado y Domingo no se mueve
  // Martes, Miercoles o Jueves: se mueve al lunes previo
  // Viernes: se mueve al lunes siguiente
  const sanPedroSanPablo = new Date(Date.UTC(year, 5, 29));
  const spDayOfWeek = sanPedroSanPablo.getUTCDay();
  if (spDayOfWeek >= 2 && spDayOfWeek <= 4) {
    // Martes, Miércoles o Jueves: mover al lunes previo
    sanPedroSanPablo.setUTCDate(sanPedroSanPablo.getUTCDate() - (spDayOfWeek - 1));
  } else if (spDayOfWeek === 5) {
    // Viernes: mover al lunes siguiente
    sanPedroSanPablo.setUTCDate(sanPedroSanPablo.getUTCDate() + 3);
  }
  // Lunes (1), Sábado (6), Domingo (0): no se mueve
  holidays.push(formatHoliday(sanPedroSanPablo, "San Pedro y San Pablo", "religioso", false));

  // Order holidays by date
  holidays.sort((a, b) => {
    if (a.date !== b.date) return a.date - b.date;
    return a.date - b.date;
  });

  // Modificamos las fechas del holiday  a Iso string y luego a Date para mantener la zona horaria correcta
  const holidayDates = new Set();
  holidays.forEach((holiday) => {
    const isoString = holiday.date.toISOString().split("T")[0];
    holidayDates.add(isoString);
  });
  return holidayDates;
}
const feriados = buildHolidays(new Date().getUTCFullYear());
const header = "// Generated using `npm run build`. Do not edit!";
const output = `${header}\nexport const feriados =  ${jsesc(feriados, {
  compact: true,
})};\n`;
require("fs").writeFileSync("./index.js", output);
