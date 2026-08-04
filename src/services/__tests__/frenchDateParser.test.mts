import { parseFrenchDate } from '../frenchDateParser';

// Mardi 4 août 2026, 10h00
const NOW = new Date(2026, 7, 4, 10, 0, 0);

let pass = 0;
let fail = 0;

function fmt(d: Date | null): string {
  if (!d) return '(aucune)';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** attendu : null = pas de date, sinon [jour, mois(1-12), année, heure, minute] */
function t(
  input: string,
  expectedTitle: string,
  expected: null | [number, number, number, number, number]
) {
  const r = parseFrenchDate(input, NOW);
  const d = r.detectedDate;
  let ok = r.cleanTitle === expectedTitle;
  if (expected === null) {
    ok = ok && d === null;
  } else {
    const [dd, mm, yy, hh, mi] = expected;
    ok =
      ok &&
      !!d &&
      d.getDate() === dd &&
      d.getMonth() === mm - 1 &&
      d.getFullYear() === yy &&
      d.getHours() === hh &&
      d.getMinutes() === mi;
  }
  if (ok) {
    pass++;
    console.log(`  ok   "${input}"`.padEnd(46), '→', `"${r.cleanTitle}"`.padEnd(22), fmt(d));
  } else {
    fail++;
    console.log(`  FAIL "${input}"`.padEnd(46), '→', `"${r.cleanTitle}"`.padEnd(22), fmt(d));
  }
}

console.log('\n--- Le cas signalé : jour + mois sans « le » ---');
t('rdv 3 aout', 'rdv', [3, 8, 2027, 0, 0]); // 3 août déjà passé (on est le 4) → 2027
t('rdv 6 janvier', 'rdv', [6, 1, 2027, 0, 0]); // janvier passé → an prochain
t('rdv 9 mai', 'rdv', [9, 5, 2027, 0, 0]); // mai passé → an prochain
t('paiement 15 septembre', 'paiement', [15, 9, 2026, 0, 0]); // à venir → cette année
t('dentiste 20 aout a 14h30', 'dentiste', [20, 8, 2026, 14, 30]);
t('reunion 12 decembre 9h', 'reunion', [12, 12, 2026, 9, 0]);

console.log('\n--- Avec « le » : doit continuer à marcher ---');
t('rdv le 3 aout', 'rdv', [3, 8, 2027, 0, 0]);
t('paiement le 15 septembre a 10h', 'paiement', [15, 9, 2026, 10, 0]);
t('appel le 3 mai à 14h30', 'appel', [3, 5, 2027, 14, 30]);

console.log('\n--- Accents et casse ---');
t('rdv 3 août', 'rdv', [3, 8, 2027, 0, 0]);
t('rdv 10 FÉVRIER', 'rdv', [10, 2, 2027, 0, 0]);
t('rdv 10 fevrier', 'rdv', [10, 2, 2027, 0, 0]);
t('rdv 1 Décembre', 'rdv', [1, 12, 2026, 0, 0]);

console.log('\n--- Les autres formats ne doivent pas casser ---');
t('course demain 12', 'course', [5, 8, 2026, 12, 0]);
t('course demain', 'course', [5, 8, 2026, 0, 0]);
t('rdv mardi 14h', 'rdv', [11, 8, 2026, 14, 0]);
t('rdv lundi prochain', 'rdv', [17, 8, 2026, 0, 0]);
t('X dans 3 jours', 'X', [7, 8, 2026, 0, 0]);
t('X dans 2 semaines', 'X', [18, 8, 2026, 0, 0]);
t('appel a 9h', 'appel', [4, 8, 2026, 9, 0]);
t('appel 14h30', 'appel', [4, 8, 2026, 14, 30]);
t('apres-demain 8h', '', [6, 8, 2026, 8, 0]);

console.log('\n--- Pas de fausse détection ---');
t('acheter 2 kg de tomates', 'acheter 2 kg de tomates', null);
t('simple course', 'simple course', null);
t('appeler le plombier', 'appeler le plombier', null);
t('relire le chapitre 3', 'relire le chapitre 3', null);
t('30 fevrier', '30 fevrier', null); // date inexistante → refusée
t('acheter 3 mais', 'acheter 3 mais', null); // « mais » n'est pas « mai »


console.log('\n--- Sans accents, comme on tape vraiment ---');
t('dentiste 20 aout a 14h30', 'dentiste', [20, 8, 2026, 14, 30]);
t('paiement le 15 septembre a 10h', 'paiement', [15, 9, 2026, 10, 0]);
t('appel a 9h', 'appel', [4, 8, 2026, 9, 0]);
t('apres-demain 8h', '', [6, 8, 2026, 8, 0]);
t('apres demain', '', [6, 8, 2026, 0, 0]);
t('course demain a 12h', 'course', [5, 8, 2026, 12, 0]);

console.log('\n--- Le « a » nu ne doit pas inventer une heure ---');
t('acheter a 3 euros', 'acheter a 3 euros', null);
t('donner a manger au chat', 'donner a manger au chat', null);

console.log(`\n${pass} réussis, ${fail} échoués\n`);
if (fail > 0) throw new Error(`${fail} test(s) du parseur en échec`);
