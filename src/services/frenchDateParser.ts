export interface ParsedDate {
  cleanTitle: string;
  detectedDate: Date | null;
  /**
   * Une heure a-t-elle été écrite ?
   *
   * On le déduisait de la valeur : « minuit pile, donc pas d'heure ». C'était
   * faux pour « demain 0h », dont l'heure disparaissait — et sans heure,
   * aucun rappel n'est programmé. Seul le texte sait s'il en portait une.
   */
  hasTime: boolean;
}

/** Date construite par un motif, avec le fait qu'une heure ait été lue ou non. */
interface Built {
  date: Date;
  hasTime: boolean;
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
  hasTime: boolean;
}

/**
 * Une date exploitable par le reste de l'application.
 *
 * « dans 999999999 jours » produisait une date invalide, écrite telle quelle
 * dans le stockage sous la forme `NaN-NaN-NaN` : la tâche restait affichée
 * « INVALID DATE » pour toujours. Au-delà de l'an 9999, la date est valide mais
 * son année tient sur cinq chiffres, ce que le format `YYYY-MM-DD` du stockage
 * et les champs de date du navigateur ne savent pas relire.
 *
 * Rien de tout cela n'est une échéance : c'est du texte mal interprété.
 */
function isUsableDate(d: Date): boolean {
  if (Number.isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  return year >= 1900 && year <= 9999;
}

/** Recherche un motif et renvoie le premier match avec sa position dans le texte original. */
function findMatch(
  lowered: string,
  regex: RegExp,
  builder: (m: RegExpExecArray, now: Date) => Built | null,
  now: Date
): Match | null {
  regex.lastIndex = 0;
  const m = regex.exec(lowered);
  if (!m) return null;
  const built = builder(m, now);
  if (!built || !isUsableDate(built.date)) return null;
  return { index: m.index, length: m[0].length, date: built.date, hasTime: built.hasTime };
}

export function parseFrenchDate(input: string, now: Date = new Date()): ParsedDate {
  const original = input;
  const lowered = input.toLowerCase();

  /*
   * Suffixe d'heure optionnel : « 12h », « 12h30 », « à 12h », « 12:30 ».
   * Les heures sont capturées dans le groupe N, les minutes dans le N+1.
   *
   * C'est le « h » — ou le deux-points, même intention — qui fait l'heure.
   * Un nombre nu n'en est jamais une : « acheter 3 mai 2 pommes » parlait de
   * deux pommes, pas de deux heures du matin, et le mot était retiré du titre
   * en prime. Rien dans une phrase ne distingue un nombre d'une heure, sauf
   * cette lettre.
   *
   * Le « à » reste facultatif et accepté sans accent : personne ne tape les
   * accents au clavier d'un téléphone.
   */
  const TIME = '(?:\\s+(?:[aà]\\s+)?(\\d{1,2})[h:](\\d{2})?)?';

  function buildTime(base: Date, hStr?: string, mStr?: string): Built | null {
    if (!hStr) return { date: base, hasTime: false };
    const hour = parseInt(hStr, 10);
    const minute = mStr ? parseInt(mStr, 10) : 0;
    if (hour > 23 || minute > 59) return null;
    return { date: applyTime(base, hour, minute), hasTime: true };
  }

  /**
   * Heure seule, sans jour précisé : « 4h », « à 18h30 ».
   *
   * Si l'heure est déjà passée, elle désigne demain. Taper « 4h » à 6h27 ne
   * veut pas dire quatre heures ce matin — c'est déjà fait — et poser la tâche
   * là la fait naître en retard. Même raisonnement que « 6 janvier » en août,
   * qui vise l'année suivante.
   *
   * Ne concerne que les heures nues : dès qu'un jour est nommé (« demain 4h »,
   * « le 15 avril à 4h »), c'est ce jour qui commande.
   */
  function buildTimeToday(n: Date, hStr?: string, mStr?: string): Built | null {
    const built = buildTime(startOfDay(n), hStr, mStr);
    if (!built) return null;
    if (built.date.getTime() < n.getTime()) built.date.setDate(built.date.getDate() + 1);
    return built;
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
  ): Built | null {
    const startToday = startOfDay(n).getTime();

    /*
     * On cherche la prochaine occurrence réelle, année par année.
     *
     * L'année était choisie APRÈS avoir validé le jour, ce qui cassait le
     * 29 février deux fois : introuvable depuis 2026 (année non bissextile,
     * abandon sans essayer 2028), et depuis mars 2028 le décalage d'un an
     * débordait silencieusement sur le 1er mars 2029.
     *
     * Huit ans suffisent : c'est le plus grand écart possible entre deux
     * années bissextiles, au passage d'un siècle non divisible par 400.
     */
    for (let ahead = 0; ahead <= 8; ahead++) {
      const base = new Date(n.getFullYear() + ahead, month, day, 0, 0, 0, 0);
      // Un jour qui n'existe pas dans cette année-là (30 février, 31 avril).
      if (base.getMonth() !== month || base.getDate() !== day) continue;
      const built = buildTime(base, hStr, mStr);
      // Une heure impossible fait tomber le motif entier, pas seulement l'année.
      if (!built) return null;
      if (built.date.getTime() >= startToday) return built;
    }
    return null;
  }

  // On essaie les motifs du plus spécifique au moins spécifique.
  const builders: Array<{
    regex: RegExp;
    build: (m: RegExpExecArray, now: Date) => Built | null;
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
        return { date: d, hasTime: false };
      },
    },
    // "dans 2 semaines"
    {
      regex: /\bdans\s+(\d+)\s+semaines?\b/i,
      build: (m, n) => {
        const x = parseInt(m[1], 10);
        const d = startOfDay(n);
        d.setDate(d.getDate() + x * 7);
        return { date: d, hasTime: false };
      },
    },
    // "à 14h30" / "a 14h" — le « h » (ou « : ») est exigé ici, sinon « a 3 »
    // dans « acheter a 3 euros » serait pris pour une heure.
    // Pas de \b avant « à » : ce n'est pas un caractère de mot.
    {
      regex: /(?:^|\s)[aà]\s+(\d{1,2})[h:](\d{2})?/i,
      build: (m, n) => buildTimeToday(n, m[1], m[2]),
    },
    // "à 14" — heure nue tolérée uniquement avec le « à » accentué, qui est
    // une intention plus explicite.
    {
      regex: /(?:^|\s)à\s+(\d{1,2})\b/i,
      build: (m, n) => buildTimeToday(n, m[1], undefined),
    },
    // "14h30" / "14h" / "14:30" — sans « à », le séparateur horaire est requis.
    {
      regex: /\b(\d{1,2})[h:](\d{2})?\b/i,
      build: (m, n) => buildTimeToday(n, m[1], m[2]),
    },
  ];

  for (const { regex, build } of builders) {
    const match = findMatch(lowered, regex, build, now);
    if (match) {
      return { cleanTitle: strip(original, match), detectedDate: match.date, hasTime: match.hasTime };
    }
  }

  return { cleanTitle: original.trim(), detectedDate: null, hasTime: false };
}
