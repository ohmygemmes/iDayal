# iDayal

**iDayal** est une PWA (Progressive Web App) de to-do list ultra simple,
centrée sur le jour. Tout ce qui n'est pas fait dans la journée est
automatiquement reporté au lendemain.

- 100% côté client — aucune base de données, juste `localStorage`.
- Installable sur iPhone via Safari → « Ajouter à l'écran d'accueil ».
- Fonctionne offline grâce à un service worker.
- Détection automatique des dates en français dans le texte saisi.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Service worker maison (cache-first)

## Démarrage local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (`http://localhost:5173/iDayal/`) dans le navigateur.

## Build de production

```bash
npm run build
npm run preview
```

## Déploiement GitHub Pages

1. Crée un dépôt GitHub nommé exactement **`iDayal`** (le `base` dans
   `vite.config.ts` est déjà `/iDayal/`).
2. Pousse ton code sur la branche `main` :
   ```bash
   git remote add origin git@github.com:<username>/iDayal.git
   git push -u origin main
   ```
3. Lance le déploiement :
   ```bash
   npm run deploy
   ```
   Cela construit le site et le pousse sur la branche `gh-pages`.
4. Dans **Settings → Pages** du dépôt GitHub, sélectionne la branche
   `gh-pages` comme source.
5. Le site est dispo à : `https://<username>.github.io/iDayal/`

> Si tu choisis un autre nom de dépôt, mets à jour `base` dans
> `vite.config.ts` (`base: '/<nom-du-depot>/'`).

## Installation sur iPhone

1. Ouvre `https://<username>.github.io/iDayal/` dans **Safari** (pas Chrome).
2. Tape l'icône **Partager** (le carré avec une flèche).
3. Choisis **« Ajouter à l'écran d'accueil »**.
4. Tu obtiens une icône iDayal qui s'ouvre en plein écran, sans la barre
   Safari.

> Les notifications web sur iOS Safari ne fonctionnent **que** quand l'app est
> installée en PWA. Active-les ensuite via le bouton ⚙️ dans l'app.

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
│   ├── icon-192.svg
│   ├── icon-512.svg
│   └── apple-touch-icon.svg
├── src/
│   ├── components/      # UI
│   ├── hooks/           # useSwipeGesture
│   ├── services/        # frenchDateParser, notificationService
│   ├── stores/          # useTaskStore (localStorage)
│   ├── types/           # task.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

## Licence

MIT.
