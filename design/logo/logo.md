# iDayal — logo & icônes

Pack de fichiers sources. **SVG uniquement**, aucun raster incorporé, aucune référence
à une police (toute typographie est convertie en tracés). Les PNG aux différentes
tailles se génèrent automatiquement à partir de ces masters.

---

## Le motif

Un anneau qui se remplit au fil de la journée autour d'un point plein : la journée en
cours, et l'instant présent au centre — la promesse d'iDayal, une seule journée à la
fois, tenue en une seule forme.

---

## Couleurs

| Rôle | Hex |
|---|---|
| Dégradé — haut | `#4A8BE8` |
| Bleu iDayal (milieu) | `#3B7DD8` |
| Dégradé — bas | `#1E4FB5` |
| Vert — point central | `#3DBA8E` |
| Encre — wordmark sur fond clair | `#16255B` |
| Sombre iOS 18 — haut | `#2C63BE` |
| Sombre iOS 18 — bas | `#12306E` |
| Orange (réservé aux alertes dans l'app, absent du logo) | `#F08A1B` |

---

## Fichiers

| Fichier | Usage | Fond |
|---|---|---|
| `idayal-icon.svg` | Icône principale iOS / Android / App Store 1024 | Opaque |
| `idayal-icon-dark.svg` | Variante mode sombre iOS 18 | Semi-transparent |
| `idayal-icon-mono.svg` | Icône teintée iOS 18 · themed icons Android 13+ | Transparent |
| `idayal-adaptive-foreground.svg` | Couche avant — Android adaptive | Transparent |
| `idayal-adaptive-background.svg` | Couche arrière — Android adaptive | Opaque |
| `idayal-wordmark.svg` | Logo + nom, fond clair | Transparent |
| `idayal-wordmark-dark.svg` | Logo + nom, fond sombre | Transparent |

---

## Géométrie (grille 1024 × 1024)

- Anneau : Ø 680, trait **96 px** — aucun trait plus fin nulle part.
- Point central : Ø 192.
- Arc de progression : 62 % de la circonférence, départ à midi, sens horaire, bouts arrondis.
- Bord extérieur du motif à **Ø 776**, soit dans le cercle de sécurité de Ø 819 (80 %).
- **Aucun coin arrondi dessiné** : iOS et Android appliquent leur propre masque.
- Avant-plan adaptatif Android ramené à **72 %** pour tenir dans les deux tiers centraux
  (Ø 559 sur 1024) — le recadrage cercle, squircle ou goutte ne rogne jamais le motif.
- Lisibilité vérifiée à 60, 40 et **29 px**.

Le wordmark utilise une grille séparée (`0 0 800 240`), lettres tracées en géométrie
pure, trait 26 px, bouts arrondis.

---

## Intégration

**iOS (Xcode 15+)** — `Assets.xcassets` → App Icon, emplacement « Single Size »,
1024×1024 : déposer le PNG exporté depuis `idayal-icon.svg`. Pour iOS 18, remplir aussi
les emplacements Dark (`idayal-icon-dark.svg`) et Tinted (`idayal-icon-mono.svg`).
Le PNG de l'App Store doit être **sans canal alpha**.

**Android** — `res/mipmap-anydpi-v26/ic_launcher.xml` :

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/idayal_adaptive_background"/>
    <foreground android:drawable="@drawable/idayal_adaptive_foreground"/>
    <monochrome android:drawable="@drawable/idayal_icon_mono"/>
</adaptive-icon>
```

Convertir les SVG en Vector Drawable via Android Studio (*New → Vector Asset*).
Play Store : icône 512×512 PNG 32 bits depuis `idayal-icon.svg`.

**Web** — `idayal-icon.svg` en favicon, `idayal-wordmark.svg` en en-tête.

---

## À ne pas faire

- Ne pas ajouter de coins arrondis, d'ombre portée ou de contour à l'icône.
- Ne pas mettre de texte dans l'icône, pas même « iD » : illisible sous 40 px.
- Ne pas modifier l'angle de départ de l'arc (midi) ni son sens (horaire).
- Ne pas recolorer le point central : le vert `#3DBA8E` est le seul accent du logo.
- Ne pas séparer le wordmark de son icône en dessous de 120 px de large — utiliser
  l'icône seule.
