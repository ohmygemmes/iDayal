import { buildStack, orderDeck } from '../stack';
import type { Task } from '../../types/task';

let pass = 0;
let fail = 0;

function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) {
    pass++;
    console.log(`  ok   ${label}`.padEnd(58), '→', JSON.stringify(got));
  } else {
    fail++;
    console.log(`  FAIL ${label}`.padEnd(58), '→', JSON.stringify(got), '≠', JSON.stringify(want));
  }
}

/** Fabrique une tâche minimale : seuls le nom et les drapeaux comptent ici. */
function t(id: string, opts: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    createdDate: '2026-08-10',
    scheduledDate: null,
    completedDate: null,
    isCarriedOver: false,
    originalDate: '2026-08-10',
    ...opts,
  };
}

const ids = (list: Task[]) => list.map((x) => x.id);

console.log('\n--- Ce qui est fait ne fait plus partie du paquet ---');
{
  const jour = [t('a'), t('b', { completedDate: '2026-08-10T09:00' }), t('c')];
  check('les tâches faites sortent', ids(buildStack(jour)), ['a', 'c']);
}

console.log("\n--- L'étoile remonte en tête ---");
/*
 * Le drapeau était rangé dans les réglages, qui ne sont pas synchronisés :
 * l'étoile posée sur le téléphone ne parvenait jamais à l'ordinateur. Elle
 * décrit la tâche, donc elle voyage avec elle.
 */
{
  check('sans étoile, l’ordre est conservé', ids(buildStack([t('a'), t('b'), t('c')])), ['a', 'b', 'c']);
  check('l’étoile passe devant', ids(buildStack([t('a'), t('b', { isPinned: true }), t('c')])), ['b', 'a', 'c']);
  check('déjà en tête, rien ne bouge', ids(buildStack([t('a', { isPinned: true }), t('b')])), ['a', 'b']);
  check(
    'une étoile déjà faite ne remonte pas',
    ids(buildStack([t('a'), t('b', { isPinned: true, completedDate: '2026-08-10T09:00' })])),
    ['a']
  );
}

console.log('\n--- Le dernier geste passe devant l’étoile ---');
/*
 * L'étoile était remontée quoi qu'il arrive : on notait une tâche en regardant
 * une carte quelconque, et une troisième — étoilée un jour et oubliée depuis —
 * surgissait à la place.
 */
{
  const jour = [t('neuve'), t('a'), t('etoile', { isPinned: true })];
  check('sans rien, l’étoile mène', ids(orderDeck(jour, null, [])), ['etoile', 'neuve', 'a']);
  check('le dernier geste la dépasse', ids(orderDeck(jour, 'neuve', [])), ['neuve', 'etoile', 'a']);
}

console.log('\n--- Ce qui est arbitré passe derrière tout le monde ---');
/*
 * Répondre « Aujourd'hui » à la question « Quand ? » laisse la tâche dans la
 * journée, donc au même endroit : la même carte revenait indéfiniment.
 */
{
  const jour = [t('a'), t('b'), t('c')];
  check('une tâche arbitrée finit le paquet', ids(orderDeck(jour, null, ['a'])), ['b', 'c', 'a']);
  check("l'ordre d'arbitrage est conservé", ids(orderDeck(jour, null, ['b', 'a'])), ['c', 'b', 'a']);
  check(
    'même étoilée, une tâche arbitrée passe derrière',
    ids(orderDeck([t('a'), t('e', { isPinned: true })], null, ['e'])),
    ['a', 'e']
  );
  check(
    'un identifiant inconnu est ignoré',
    ids(orderDeck([t('a'), t('b')], null, ['disparue'])),
    ['a', 'b']
  );
}

console.log('\n--- Les trois couches ensemble ---');
{
  const jour = [t('a'), t('b'), t('c', { isPinned: true }), t('d')];
  check('devant, étoile, reste, arbitrées', ids(orderDeck(jour, 'd', ['a'])), ['d', 'c', 'b', 'a']);
}

console.log(`\n${pass} réussis, ${fail} échoués\n`);
if (fail > 0) throw new Error(`${fail} test(s) d'ordre du paquet en échec`);
