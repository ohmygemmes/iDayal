export interface ParsedDate {
  cleanTitle: string;
  detectedDate: Date | null;
}

const MONTHS: Record<string, number> = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
};

const WEEKDAYS: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
};

const MONTH_PATTERN =
  '(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)';
const WEEKDAY_PATTERN = '(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function nextWeekday(target: number, fromDate: Date, forceNextWeek = false): Date {
  const today = startOfDay(fromDate);
  const cur = today.getDay();
  let diff = (target - cur + 7) % 7;
  if (diff === 0) diff = 7; // si même jour, on prend la semaine suivante
  if (forceNextWeek) diff += 7;
  const out = new Date(today);
  out.setDate(today.getDate() + diff);
  return out;
}

function applyTime(date: Date, hour: number, minute: number): Date {
  const out = new Date(date);
  out.setHours(hour, minute, 0, 0);
  return out;
}

/** Retire la portion match du titre, normalise les espaces. */
function strip(text: string, match: { index: number; length: number }): string {
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match.length);
  return `${before} ${after}`.replace(/\s+/g, ' ').trim();
}

interface Match {
  index: number;
  length: number;
  date: Date;
}

/** Recherche un motif et renvoie le premier match avec sa position dans le texte original. */
function findMatch(
  text: string,
  lowered: string,
  regex: RegExp,
  builder: (m: RegExpExecArray, now: Date) => Date | null,
  now: Date
): Match | null {
  regex.lastIndex = 0;
  const m = regex.exec(lowered);
  if (!m) return null;
  const date = builder(m, now);
  if (!date) return null;
  return { index: m.index, length: m[0].length, date };
}

export function parseFrenchDate(input: string, now: Date = new Date()): ParsedDate {
  const original = input;
  const text = input;
  const lowered = input.toLowerCase();

  // On essaie les motifs du plus spécifique au moins spécifique.
  const builders: Array<{
    regex: RegExp;
    build: (m: RegExpExecArray, now: Date) => Date | null;
  }> = [
    // "le 15 avril à 10h30" / "le 15 avril à 14h"
    {
      regex: new RegExp(
        `\\ble\\s+(\\d{1,2})\\s+${MONTH_PATTERN}(?:\\s+à\\s+(\\d{1,2})h(\\d{2})?)?\\b`,
        'i'
      ),
      build: (m, n) => {
        const day = parseInt(m[1], 10);
        const month = MONTHS[m[2].toLowerCase()];
        if (month === undefined) return null;
        const hour = m[3] ? parseInt(m[3], 10) : 0;
        const minute = m[4] ? parseInt(m[4], 10) : 0;
        let year = n.getFullYear();
        const candidate = new Date(year, month, day, hour, minute, 0, 0);
        if (candidate.getTime() < startOfDay(n).getTime()) {
          candidate.setFullYear(year + 1);
        }
        return candidate;
      },
    },
    // "après-demain à 14h30"
    {
      regex: /\baprès[-\s]demain(?:\s+à\s+(\d{1,2})h(\d{2})?)?\b/i,
      build: (m, n) => {
        const d = startOfDay(n);
        d.setDate(d.getDate() + 2);
        const hour = m[1] ? parseInt(m[1], 10) : 0;
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        return m[1] ? applyTime(d, hour, minute) : d;
      },
    },
    // "demain à 14h30"
    {
      regex: /\bdemain(?:\s+à\s+(\d{1,2})h(\d{2})?)?\b/i,
      build: (m, n) => {
        const d = startOfDay(n);
        d.setDate(d.getDate() + 1);
        const hour = m[1] ? parseInt(m[1], 10) : 0;
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        return m[1] ? applyTime(d, hour, minute) : d;
      },
    },
    // "lundi prochain à 10h"
    {
      regex: new RegExp(`\\b${WEEKDAY_PATTERN}\\s+prochain(?:\\s+à\\s+(\\d{1,2})h(\\d{2})?)?\\b`, 'i'),
      build: (m, n) => {
        const wd = WEEKDAYS[m[1].toLowerCase()];
        if (wd === undefined) return null;
        const d = nextWeekday(wd, n, true);
        const hour = m[2] ? parseInt(m[2], 10) : 0;
        const minute = m[3] ? parseInt(m[3], 10) : 0;
        return m[2] ? applyTime(d, hour, minute) : d;
      },
    },
    // "lundi à 10h"
    {
      regex: new RegExp(`\\b${WEEKDAY_PATTERN}(?:\\s+à\\s+(\\d{1,2})h(\\d{2})?)?\\b`, 'i'),
      build: (m, n) => {
        const wd = WEEKDAYS[m[1].toLowerCase()];
        if (wd === undefined) return null;
        const d = nextWeekday(wd, n, false);
        const hour = m[2] ? parseInt(m[2], 10) : 0;
        const minute = m[3] ? parseInt(m[3], 10) : 0;
        return m[2] ? applyTime(d, hour, minute) : d;
      },
    },
    // "dans 3 jours"
    {
      regex: /\bdans\s+(\d+)\s+jours?\b/i,
      build: (m, n) => {
        const x = parseInt(m[1], 10);
        const d = startOfDay(n);
        d.setDate(d.getDate() + x);
        return d;
      },
    },
    // "dans 2 semaines"
    {
      regex: /\bdans\s+(\d+)\s+semaines?\b/i,
      build: (m, n) => {
        const x = parseInt(m[1], 10);
        const d = startOfDay(n);
        d.setDate(d.getDate() + x * 7);
        return d;
      },
    },
    // "à 14h30" / "à 9h" — uniquement à la fin pour éviter de capturer dans "le X mois à Yh"
    {
      regex: /\bà\s+(\d{1,2})h(\d{2})?\b/i,
      build: (m, n) => {
        const hour = parseInt(m[1], 10);
        const minute = m[2] ? parseInt(m[2], 10) : 0;
        if (hour > 23 || minute > 59) return null;
        return applyTime(startOfDay(n), hour, minute);
      },
    },
  ];

  for (const { regex, build } of builders) {
    const match = findMatch(text, lowered, regex, build, now);
    if (match) {
      return { cleanTitle: strip(original, match) || original.trim(), detectedDate: match.date };
    }
  }

  return { cleanTitle: original.trim(), detectedDate: null };
}
