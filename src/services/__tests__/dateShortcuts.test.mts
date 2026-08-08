/*
 * Le fuseau est fixé avant tout usage de Date : les cas de changement d'heure
 * n'existent qu'en heure locale, et la machine qui joue les tests est en UTC.
 */
process.env.TZ = 'Europe/Paris';

import { atTimeOfDay, shiftBy } from '../dateShortcuts';

let pass = 0;
let fail = 0;

function t(nom: string, attendu: string, obtenu: string) {
  if (obtenu === attendu) {
    pass++;
    console.log(`  ok   ${nom} → ${obtenu}`);
  } else {
    fail++;
    console.log(`  FAIL ${nom} → ${obtenu} (attendu ${attendu})`);
  }
}

/** Un instant de référence, pour que rien ne dépende de l'heure qu'il est. */
const le8aout = (h = 10, m = 0) => new Date(2026, 7, 8, h, m);

console.log('\n--- La règle : le décalage part de l’heure retenue ---');
t('12:00 puis +1h', '2026-08-08T13:00', shiftBy('2026-08-08T12:00', 1, le8aout()));
t('12:00 puis 6h', '2026-08-08T18:00', shiftBy('2026-08-08T12:00', 6, le8aout()));
t('12:00 puis 24', '2026-08-09T12:00', shiftBy('2026-08-08T12:00', 24, le8aout()));
t(
  '09:00 puis +1h deux fois',
  '2026-08-08T11:00',
  shiftBy(shiftBy('2026-08-08T09:00', 1, le8aout()), 1, le8aout())
);

console.log('\n--- Changement d’heure : « 24 » doit rendre la même heure ---');
t('veille du passage à l’heure d’hiver', '2026-10-25T12:00', shiftBy('2026-10-24T12:00', 24, le8aout()));
t('veille du passage à l’heure d’été', '2026-03-29T12:00', shiftBy('2026-03-28T12:00', 24, le8aout()));
t('+1h dans l’heure qui disparaît', '2026-03-29T03:00', shiftBy('2026-03-29T01:00', 1, le8aout()));

console.log('\n--- Un jour retenu sans heure ---');
t(
  'aujourd’hui : on part de l’heure courante',
  '2026-08-08T11:30',
  shiftBy('2026-08-08', 1, le8aout(10, 30))
);
t(
  'un autre jour, le soir : le jour choisi ne bascule pas',
  '2026-08-20T10:00',
  shiftBy('2026-08-20', 1, le8aout(23, 30))
);

console.log('\n--- Rien de retenu : on part de maintenant ---');
t('+1h sans rien', '2026-08-08T11:30', shiftBy('', 1, le8aout(10, 30)));
t('24 sans rien', '2026-08-09T10:30', shiftBy('', 24, le8aout(10, 30)));

console.log('\n--- Poser une heure fixe ---');
t('garde le jour retenu', '2026-08-20T09:00', atTimeOfDay('2026-08-20', 9, 0, le8aout()));
t('remplace l’heure déjà posée', '2026-08-20T18:00', atTimeOfDay('2026-08-20T09:00', 18, 0, le8aout()));
t('sans jour retenu, c’est aujourd’hui', '2026-08-08T12:00', atTimeOfDay('', 12, 0, le8aout()));

console.log(`\n${pass} réussis, ${fail} échoués`);
if (fail > 0) process.exit(1);
