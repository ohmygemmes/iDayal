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

## Noter une tâche sans ouvrir l'app (iPhone)

iDayal accepte un paramètre `?add=` dans l'URL : la tâche est créée dès
l'ouverture, puis le paramètre est retiré de l'URL.

```
https://<url-de-liDayal>/?add=rappeler%20le%20dentiste%20demain%20à%2010h
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
   `https://<url-de-liDayal>/?add=` suivi du résultat de *Coder l'URL*
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

Coller plusieurs lignes dans le champ de saisie crée une tâche par ligne.

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
