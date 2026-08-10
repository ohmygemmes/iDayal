import {
  create,
  displayedMs,
  elapsed,
  formatDuration,
  isFinished,
  isRunning,
  pause,
  remaining,
  start,
  toggle,
  withMode,
} from '../timer';

let pass = 0;
let fail = 0;

function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) {
    pass++;
    console.log(`  ok   ${label}`.padEnd(62), '→', JSON.stringify(got));
  } else {
    fail++;
    console.log(`  FAIL ${label}`.padEnd(62), '→', JSON.stringify(got), '≠', JSON.stringify(want));
  }
}

const T0 = 1_754_800_000_000; // instant arbitraire
const MIN = 60_000;

console.log('\n--- Un chrono compte le temps réel, pas les battements ---');
/*
 * Le piège central : une vue web suspend ses minuteries en arrière-plan. Ces
 * tests passent d'un instant à l'autre sans jamais rien incrémenter — c'est
 * exactement ce que fait le code, et c'est pour ça qu'il survit à un écran
 * éteint pendant deux heures.
 */
{
  const t = start(create('a', 'up'), T0);
  check('rien ne s’est écoulé au démarrage', elapsed(t, T0), 0);
  check('douze minutes plus tard', elapsed(t, T0 + 12 * MIN), 12 * MIN);
  check('deux heures plus tard, écran éteint', elapsed(t, T0 + 120 * MIN), 120 * MIN);
  check('un chrono ne finit jamais', isFinished(t, T0 + 999 * MIN), false);
}

console.log('\n--- La pause fige, la reprise ne perd rien ---');
{
  let t = start(create('a', 'up'), T0);
  t = pause(t, T0 + 5 * MIN);
  check('en pause, le temps est retenu', elapsed(t, T0 + 5 * MIN), 5 * MIN);
  check('en pause, le temps ne bouge plus', elapsed(t, T0 + 90 * MIN), 5 * MIN);
  check('en pause, plus en marche', isRunning(t), false);

  t = start(t, T0 + 90 * MIN);
  check('reprise : le temps d’arrêt ne compte pas', elapsed(t, T0 + 92 * MIN), 7 * MIN);
  check('en marche à nouveau', isRunning(t), true);
}

console.log('\n--- Le compte à rebours s’arrête à zéro, jamais en dessous ---');
{
  const t = start(create('a', 'down', 25 * MIN), T0);
  check('vingt-cinq minutes au départ', remaining(t, T0), 25 * MIN);
  check('après dix minutes', remaining(t, T0 + 10 * MIN), 15 * MIN);
  check('à l’heure pile', remaining(t, T0 + 25 * MIN), 0);
  check('bien après, toujours zéro', remaining(t, T0 + 300 * MIN), 0);
  check('terminé à l’heure pile', isFinished(t, T0 + 25 * MIN), true);
  check('pas terminé avant', isFinished(t, T0 + 24 * MIN), false);
}

console.log('\n--- Ce que la carte affiche dépend du mode ---');
{
  const up = start(create('a', 'up'), T0);
  const down = start(create('a', 'down', 25 * MIN), T0);
  check('chrono : le temps couru', displayedMs(up, T0 + 3 * MIN), 3 * MIN);
  check('minuteur : le temps restant', displayedMs(down, T0 + 3 * MIN), 22 * MIN);
}

console.log('\n--- Changer de mode remet à zéro ---');
/*
 * Douze minutes courues ne veulent rien dire une fois converties en compte à
 * rebours, et l'inverse non plus. Reporter la valeur produirait un minuteur
 * lancé à une durée que personne n'a choisie.
 */
{
  let t = start(create('a', 'up'), T0);
  t = withMode(t, 'down', 5 * MIN);
  check('le temps couru est oublié', elapsed(t, T0 + 12 * MIN), 0);
  check('la nouvelle durée est en place', remaining(t, T0), 5 * MIN);
  check('et il est à l’arrêt', isRunning(t), false);
}

console.log('\n--- La bascule marche dans les deux sens ---');
{
  let t = create('a', 'up');
  check('créé à l’arrêt', isRunning(t), false);
  t = toggle(t, T0);
  check('un appui le lance', isRunning(t), true);
  t = toggle(t, T0 + 4 * MIN);
  check('un second l’arrête', isRunning(t), false);
  check('en retenant les quatre minutes', elapsed(t, T0 + 99 * MIN), 4 * MIN);
}

console.log('\n--- L’affichage ne montre les heures que s’il y en a ---');
check('zéro', formatDuration(0), '00:00');
check('quarante-sept secondes', formatDuration(47_000), '00:47');
check('vingt-cinq minutes', formatDuration(25 * MIN), '25:00');
check('cinquante-neuf minutes', formatDuration(59 * MIN), '59:00');
check('une heure pile', formatDuration(60 * MIN), '01:00:00');
check('une heure douze et 47 s', formatDuration(72 * MIN + 47_000), '01:12:47');
check('une durée négative reste à zéro', formatDuration(-5000), '00:00');

console.log(`\n${pass} réussis, ${fail} échoués\n`);
if (fail > 0) throw new Error(`${fail} test(s) de minuterie en échec`);
