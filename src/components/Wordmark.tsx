interface Props {
  /** Hauteur en pixels ; la largeur suit le rapport 800:240. */
  height?: number;
  className?: string;
}

/**
 * Le logo complet — icône et nom.
 *
 * Les lettres sont des tracés géométriques, pas une police : elles ne peuvent
 * servir qu'ici. Elles utilisent `currentColor`, ce qui permet au mode sombre
 * de les inverser sans dupliquer le fichier — c'était la seule différence entre
 * les deux variantes fournies.
 *
 * Intégré en ligne plutôt que chargé : moins d'un kilo-octet, aucune requête,
 * et aucun problème de chemin de base.
 */
export function Wordmark({ height = 34, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 800 240"
      height={height}
      width={(height * 800) / 240}
      className={className}
      role="img"
      aria-label="iDayal"
    >
      <defs>
        <linearGradient id="idayal-wordmark-gradient" x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#4A8BE8" />
          <stop offset="0.5" stopColor="#3B7DD8" />
          <stop offset="1" stopColor="#1E4FB5" />
        </linearGradient>
      </defs>

      {/* L'icône garde ses couleurs propres : elle est lisible sur clair comme sur sombre. */}
      <g transform="translate(10 25) scale(0.1855)">
        <rect width="1024" height="1024" rx="225" fill="url(#idayal-wordmark-gradient)" />
        <circle
          cx="512"
          cy="512"
          r="340"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.34"
          strokeWidth="96"
        />
        <circle
          cx="512"
          cy="512"
          r="340"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="96"
          strokeLinecap="round"
          strokeDasharray="1324.5 831.8"
          transform="rotate(-90 512 512)"
        />
        <circle cx="512" cy="512" r="96" fill="#3DBA8E" />
      </g>

      {/* Le nom suit la couleur du texte environnant. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M262 100 V170" />
        <path d="M300 50 V170" />
        <path d="M300 50 H336 a60 60 0 0 1 0 120 H300" />
        <path d="M430 135 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0 Z" />
        <path d="M500 100 V170" />
        <path d="M535 100 L567 163" />
        <path d="M599 100 L553 198" />
        <path d="M635 135 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0 Z" />
        <path d="M705 100 V170" />
        <path d="M743 50 V170" />
      </g>
      <circle cx="262" cy="64" r="14" fill="currentColor" />
    </svg>
  );
}
