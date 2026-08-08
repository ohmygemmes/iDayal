import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idayal.app',
  appName: 'iDayal',
  webDir: 'dist',
  ios: {
    /*
     * L'application place elle-même son contenu à l'écart de l'encoche et de
     * la barre de gestes : `env(safe-area-inset-*)` est déjà utilisé dans
     * l'en-tête, la barre d'onglets, la barre de saisie et les feuilles.
     *
     * Laisser iOS ajuster en plus les marges du défilement ferait le travail
     * une seconde fois, et le contenu sauterait au défilement. On lui demande
     * donc de ne rien ajuster.
     */
    contentInset: 'never',

    /*
     * Couleur derrière la vue web. Elle n'apparaît qu'en débordement de
     * défilement, que `overscroll-behavior-y: contain` limite déjà.
     *
     * À VÉRIFIER SUR L'APPAREIL en thème sombre : cette valeur est unique,
     * elle ne suit pas le thème. Si un liseré clair apparaît, on la traitera
     * autrement.
     */
    backgroundColor: '#f4f5f7',
  },
};

export default config;
