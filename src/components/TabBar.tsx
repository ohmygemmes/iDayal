import type { TabKey } from '../types/task';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  onOpenSettings: () => void;
}

const SETTINGS_ICON = (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const TODAY_ICON = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const LATER_ICON = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);

const CARDS_ICON = (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6.5" y="4" width="11" height="16" rx="2.5" />
    <rect x="3" y="7" width="11" height="13" rx="2.5" opacity="0.5" />
  </svg>
);

const NOTES_ICON = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h11l4 4v12H5z" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

function SideTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: JSX.Element;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 min-w-0 flex flex-col items-center justify-center pt-2 pb-1.5 transition-transform active:scale-95"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
          active
            ? 'bg-idayal-blue/12 dark:bg-idayal-blue/25 text-idayal-blue dark:text-idayal-blue-light'
            : 'text-idayal-text-muted dark:text-zinc-400'
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[9.5px] mt-0.5 font-medium tracking-tightish truncate max-w-full px-0.5 transition-colors ${
          active
            ? 'text-idayal-blue dark:text-idayal-blue-light'
            : 'text-idayal-text-muted dark:text-zinc-500'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function TabBar({ active, onChange, onOpenSettings }: Props) {
  const cardsActive = active === 'cards';
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-3 mb-2 flex items-end justify-around bg-white/85 dark:bg-idayal-bg-dark-elev/85 backdrop-blur-xl rounded-bar shadow-bar border border-idayal-border dark:border-idayal-border-dark px-1">
        <SideTab
          label="Aujourd'hui"
          icon={TODAY_ICON}
          active={active === 'today'}
          onClick={() => onChange('today')}
        />
        <SideTab
          label="Plus tard"
          icon={LATER_ICON}
          active={active === 'later'}
          onClick={() => onChange('later')}
        />

        {/*
          Cartes — le cœur de l'application, mais à plat.
          Le bouton bombé qui dépassait de la barre est un motif de réseau social,
          réservé à une création. Ici il n'ouvre qu'une vue : il garde son rang par
          la couleur, un socle plein, et non plus par le relief.
        */}
        <button
          type="button"
          onClick={() => onChange('cards')}
          aria-label="Cartes"
          aria-current={cardsActive ? 'page' : undefined}
          className="flex-1 min-w-0 flex flex-col items-center justify-center pt-2 pb-1.5 transition-transform active:scale-95"
        >
          <span
            className={`flex items-center justify-center w-11 h-7 rounded-[11px] text-white transition-all duration-300 ${
              cardsActive
                ? 'bg-idayal-blue shadow-[0_3px_10px_rgba(59,125,216,0.40)]'
                : 'bg-idayal-blue/75 dark:bg-idayal-blue/60'
            }`}
          >
            {CARDS_ICON}
          </span>
          <span
            className={`text-[9.5px] mt-0.5 font-semibold tracking-tightish truncate max-w-full px-0.5 transition-colors ${
              cardsActive
                ? 'text-idayal-blue dark:text-idayal-blue-light'
                : 'text-idayal-text-secondary dark:text-zinc-400'
            }`}
          >
            Cartes
          </span>
        </button>

        <SideTab
          label="Notes"
          icon={NOTES_ICON}
          active={active === 'notes'}
          onClick={() => onChange('notes')}
        />
        <SideTab
          label="Réglages"
          icon={SETTINGS_ICON}
          active={false}
          onClick={onOpenSettings}
        />
      </div>
    </nav>
  );
}
