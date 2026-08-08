# iDayal

**iDayal** est une PWA (Progressive Web App) de to-do list ultra simple,
centrée sur le jour. Tout ce qui n'est pas fait dans la journée est
automatiquement reporté au lendemain.

- 100% côté client — pas de backend, les tâches vivent dans `localStorage`.
- Synchronisation entre appareils **facultative** : sans configuration,
  l'application est strictement locale et n'émet aucune requête.
- Installable sur iPhone via Safari → « Ajouter à l'écran d'accueil ».
- Fonctionne offline grâce à un service worker.
- Détection automatique des dates en français dans le texte saisi.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Service worker maison : **réseau d'abord pour les navigations**, cache
  d'abord pour les ressources empreintées (voir `public/sw.js`)

## Démarrage local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (`http://localhost:5173/`) dans le navigateur.

## Build de production

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

Le parseur de dates et l'arbitrage de synchronisation sont couverts. Le
workflow de déploiement joue ces tests avant de construire : un échec bloque
la mise en ligne.

## Déploiement

Le site est en ligne sur **https://ohmygemmes.github.io/iDayal/**.

Le déploiement est **automatique et il n'y a rien à lancer à la main** :
chaque push sur la branche de production déclenche
`.github/workflows/deploy.yml`, qui installe les dépendances avec `npm ci`,
joue les tests, construit le site et le publie sur GitHub Pages via
`actions/deploy-pages`.

Deux conséquences à connaître avant de toucher au dépôt :

- **`npm ci` installe depuis `package-lock.json`, pas depuis `package.json`.**
  Modifier l'un sans régénérer l'autre casse le déploiement.
- Les identifiants de synchronisation sont fournis au build par les secrets
  GitHub `VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY`. **S'ils sont absents, le
  build réussit quand même** et l'application se construit en mode purement
  local, sans compte ni requête réseau. C'est voulu.

`base` vaut `'./'` dans `vite.config.ts`. Les chemins étant relatifs, le même
build fonctionne à la racine d'un domaine comme dans un sous-chemin — il n'y a
rien à changer si l'adresse change.

## Installation sur iPhone

1. Ouvre `https://ohmygemmes.github.io/iDayal/` dans **Safari** (pas Chrome).
2. Tape l'icône **Partager** (le carré avec une flèche).
3. Choisis **« Ajouter à l'écran d'accueil »**.
4. Tu obtiens une icône iDayal qui s'ouvre en plein écran, sans la barre
   Safari.

> Les notifications web sur iOS Safari ne fonctionnent **que** quand l'app est
> installée en PWA. Active-les ensuite via le bouton ⚙️ dans l'app.

## Noter une tâche sans ouvrir l'app (iPhone)

iDayal accepte un paramètre `?add=` dans l'URL : la tâche est créée dès
l'ouverture, puis le paramètre est retiré de l'URL.

```
https://ohmygemmes.github.io/iDayal/?add=rappeler%20le%20dentiste%20demain%20à%2010h
```

Ça permet de brancher un **raccourci iOS** et de noter une tâche à la voix
ou en un appui, sans naviguer dans l'app.

### Créer le raccourci (une fois, ~2 min)

1. Ouvre l'app **Raccourcis** → **+** (nouveau raccourci)
2. Ajoute l'action **« Demander une entrée »**
   - Type : *Texte*
   - Question : `Quoi ?`
3. Ajoute l'action **« Coder l'URL »** et passe-lui la *Réponse fournie*
4. Ajoute l'action **« Texte »** avec :
   `https://ohmygemmes.github.io/iDayal/?add=` suivi du résultat de *Coder l'URL*
5. Ajoute l'action **« Ouvrir les URL »** avec ce texte
6. Nomme le raccourci **« Noter »** et enregistre

Ensuite tu peux le déclencher par :

- **Siri** — « Dis Siri, Noter » → tu dictes → c'est enregistré
- **Bouton Action** (iPhone 15 Pro et +) — Réglages → Bouton Action → Raccourci
- **Toucher au dos** — Réglages → Accessibilité → Toucher → Toucher au dos
- **Écran verrouillé / widget** — ajoute le raccourci en widget

> Le menu **Partager** d'iOS n'est pas utilisable : Apple ne supporte pas le
> Web Share Target pour les PWA. Le raccourci ci-dessus le remplace.

## Raccourcis clavier (ordinateur)

| Touche | Action |
| --- | --- |
| `/` ou `n` | Aller dans le champ de saisie |
| `Échap` | Sortir du champ |
| `1` `2` `3` | Aujourd'hui / Cartes / Plus tard |
| `←` `→` | Sur une carte : reporter / terminer |

Le champ de saisie crée **une tâche à la fois**. Coller un texte de plusieurs
lignes n'en crée qu'une : le clavier d'un téléphone ne permet pas d'aller à la
ligne, donc la saisie multiple ne servait qu'à l'ordinateur — et faisait
disparaître ce qui était déjà tapé.

> Pour noter plusieurs choses d'un coup depuis un raccourci iOS, le paramètre
> `?add=` accepte toujours plusieurs lignes (voir plus haut).

## Détection de dates en français

Le parser comprend des expressions comme :

- `demain`, `après-demain`
- `lundi`, `mardi`… (prochaine occurrence)
- `lundi prochain`, `mardi prochain`… (semaine d'après)
- `dans 3 jours`, `dans 2 semaines`
- `le 15 avril`, `le 3 mai à 14h30`
- `à 10h`, `à 14h30` (aujourd'hui à cette heure)

Exemple : tape **« appeler Marie demain à 10h »** → la tâche s'enregistre
avec `scheduledDate` = demain 10:00, et son titre devient `appeler Marie`.

## Structure

```
iDayal/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   ├── apple-touch-icon.png
│   ├── favicon.svg
│   └── favicon-32.png
├── src/
│   ├── components/      # UI
│   ├── hooks/           # useSwipeGesture, useCloudSync
│   ├── services/        # frenchDateParser, syncDecision, cloudSync…
│   ├── stores/          # useTaskStore (localStorage)
│   ├── types/           # task.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── design/              # SVG maîtres du logo + exports magasins
├── .github/workflows/   # deploy.yml
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Licence

MIT.
