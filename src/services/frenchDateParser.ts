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
  const lowered = input.toLowerCase();

  // Suffixe optionnel pour une heure : "à 12", "à 12h", "12h", "12h30", "12:30", "12"
  // Capture les heures dans le groupe N et les minutes dans le groupe N+1.
  // Le "à" est optionnel ; "h" ou ":" sont optionnels (mais on a au moins un chiffre).
  // Le « à » est optionnel et accepté sans accent : on tape rarement les
  // accents au clavier du téléphone.
  const TIME = '(?:\\s+(?:[aà]\\s+)?(\\d{1,2})(?:[h:](\\d{2})?)?)?';

  function buildTime(base: Date, hStr?: string, mStr?: string): Date | null {
    if (!hStr) return base;
    const hour = parseInt(hStr, 10);
    const minute = mStr ? parseInt(mStr, 10) : 0;
    if (hour > 23 || minute > 59) return null;
    return applyTime(base, hour, minute);
  }

  /**
   * Construit une date jour + mois. Sans année précisée, si la date est déjà
   * passée on vise l'année suivante — « 6 janvier » en août veut dire l'an prochain.
   */
  function buildDayMonth(
    day: number,
    month: number,
    hStr: string | undefined,
    mStr: string | undefined,
    n: Date
  ): Date | null {
    const year = n.getFullYear();
    const base = new Date(year, month, day, 0, 0, 0, 0);
    // Rejette les jours qui n'existent pas (31 février bascule sur mars).
    if (base.getMonth() !== month || base.getDate() !== day) return null;
    const dt = buildTime(base, hStr, mStr);
    if (!dt) return null;
    if (dt.getTime() < startOfDay(n).getTime()) dt.setFullYear(year + 1);
    return dt;
  }

  // On essaie les motifs du plus spécifique au moins spécifique.
  const builders: Array<{
    regex: RegExp;
    build: (m: RegExpExecArray, now: Date) => Date | null;
  }> = [
    // "[le] 15 avril [à] [12[h[30]]]" — le « le » est facultatif : on écrit
    // aussi bien « rdv 3 août » que « rdv le 3 août ».
    {
      regex: new RegExp(`\\b(?:le\\s+)?(\\d{1,2})\\s+${MONTH_PATTERN}${TIME}\\b`, 'i'),
      build: (m, n) => {
        const day = parseInt(m[1], 10);
        const month = MONTHS[m[2].toLowerCase()];
        if (month === undefined) return null;
        return buildDayMonth(day, month, m[3], m[4], n);
      },
    },
    // "après-demain [à] [12[h[30]]]" — accent et tiret facultatifs
    {
      regex: new RegExp(`\\bapr[eè]s[-\\s]?demain${TIME}\\b`, 'i'),
      build: (m, n) => {
        const d = startOfDay(n);
        d.setDate(d.getDate() + 2);
        return buildTime(d, m[1], m[2]);
      },
    },
    // "demain [à] [12[h[30]]]"
    {
      regex: new RegExp(`\\bdemain${TIME}\\b`, 'i'),
      build: (m, n) => {
        const d = startOfDay(n);
        d.setDate(d.getDate() + 1);
        return buildTime(d, m[1], m[2]);
      },
    },
    // "lundi prochain [à] [10[h]]"
    {
      regex: new RegExp(`\\b${WEEKDAY_PATTERN}\\s+prochain${TIME}\\b`, 'i'),
      build: (m, n) => {
        const wd = WEEKDAYS[m[1].toLowerCase()];
        if (wd === undefined) return null;
        const d = nextWeekday(wd, n, true);
        return buildTime(d, m[2], m[3]);
      },
    },
    // "lundi [à] [10[h]]"
    {
      regex: new RegExp(`\\b${WEEKDAY_PATTERN}${TIME}\\b`, 'i'),
      build: (m, n) => {
        const wd = WEEKDAYS[m[1].toLowerCase()];
        if (wd === undefined) return null;
        const d = nextWeekday(wd, n, false);
        return buildTime(d, m[2], m[3]);
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
    // "à 14h30" / "a 14h" — le « h » (ou « : ») est exigé ici, sinon « a 3 »
    // dans « acheter a 3 euros » serait pris pour une heure.
    // Pas de \b avant « à » : ce n'est pas un caractère de mot.
    {
      regex: /(?:^|\s)[aà]\s+(\d{1,2})[h:](\d{2})?/i,
      build: (m, n) => buildTime(startOfDay(n), m[1], m[2]),
    },
    // "à 14" — heure nue tolérée uniquement avec le « à » accentué, qui est
    // une intention plus explicite.
    {
      regex: /(?:^|\s)à\s+(\d{1,2})\b/i,
      build: (m, n) => buildTime(startOfDay(n), m[1], undefined),
    },
    // "14h30" / "14h" / "14:30" — sans « à », le séparateur horaire est requis.
    {
      regex: /\b(\d{1,2})[h:](\d{2})?\b/i,
      build: (m, n) => buildTime(startOfDay(n), m[1], m[2]),
    },
  ];

  for (const { regex, build } of builders) {
    const match = findMatch(lowered, regex, build, now);
    if (match) {
      return { cleanTitle: strip(original, match), detectedDate: match.date };
    }
  }

  return { cleanTitle: original.trim(), detectedDate: null };
}
