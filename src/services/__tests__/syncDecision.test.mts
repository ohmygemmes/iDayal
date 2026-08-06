import { decideSync, type SyncDecision } from '../syncDecision';

let pass = 0;
let fail = 0;

const VIDE = JSON.stringify({ tasks: [], notes: [] });
const AVEC = JSON.stringify({ tasks: [{ id: 't1', title: 'Courses' }], notes: [] });
const AUTRE = JSON.stringify({ tasks: [{ id: 't2', title: 'Dossier' }], notes: [] });

function t(nom: string, attendu: SyncDecision, obtenu: SyncDecision) {
  if (obtenu === attendu) {
    pass++;
    console.log(`  ok   ${nom} → ${obtenu}`);
  } else {
    fail++;
    console.log(`  FAIL ${nom} → ${obtenu} (attendu ${attendu})`);
  }
}

console.log("\n--- Le bug signalé : connexion depuis un appareil vierge ---");
t(
  'appareil vide, serveur rempli',
  'adopt',
  decideSync({
    localJson: VIDE,
    localIsEmpty: true,
    remote: { json: AVEC, updatedAt: '2026-08-06T10:00:00Z' },
    lastLocalEditAt: 0,
  })
);
t(
  "appareil vide dont l'horodatage a été estampillé par erreur",
  'adopt',
  decideSync({
    localJson: VIDE,
    localIsEmpty: true,
    remote: { json: AVEC, updatedAt: '2026-08-06T10:00:00Z' },
    // Cas qui provoquait la perte : l'estampille locale plus récente que le serveur.
    lastLocalEditAt: new Date('2026-08-06T23:00:00Z').getTime(),
  })
);

console.log('\n--- Premier envoi ---');
t(
  'serveur vierge, appareil rempli',
  'push',
  decideSync({ localJson: AVEC, localIsEmpty: false, remote: null, lastLocalEditAt: 0 })
);
t(
  'serveur vierge, appareil vide : ne rien créer',
  'noop',
  decideSync({ localJson: VIDE, localIsEmpty: true, remote: null, lastLocalEditAt: 0 })
);

console.log('\n--- Fonctionnement courant ---');
t(
  'états identiques',
  'noop',
  decideSync({
    localJson: AVEC,
    localIsEmpty: false,
    remote: { json: AVEC, updatedAt: '2026-08-06T10:00:00Z' },
    lastLocalEditAt: 0,
  })
);
t(
  'modification locale plus récente que le serveur',
  'push',
  decideSync({
    localJson: AUTRE,
    localIsEmpty: false,
    remote: { json: AVEC, updatedAt: '2026-08-06T10:00:00Z' },
    lastLocalEditAt: new Date('2026-08-06T11:00:00Z').getTime(),
  })
);
t(
  "serveur plus récent que la dernière modification d'ici",
  'adopt',
  decideSync({
    localJson: AUTRE,
    localIsEmpty: false,
    remote: { json: AVEC, updatedAt: '2026-08-06T12:00:00Z' },
    lastLocalEditAt: new Date('2026-08-06T11:00:00Z').getTime(),
  })
);

console.log('\n--- Suppression volontaire de tout ---');
t(
  'vidage assumé après modification locale : le vide ne remonte pas tout seul',
  'adopt',
  decideSync({
    localJson: VIDE,
    localIsEmpty: true,
    remote: { json: AVEC, updatedAt: '2026-08-06T10:00:00Z' },
    lastLocalEditAt: new Date('2026-08-06T11:00:00Z').getTime(),
  })
);

console.log(`\n${pass} réussis, ${fail} échoués\n`);
if (fail > 0) throw new Error(`${fail} test(s) de synchronisation en échec`);
