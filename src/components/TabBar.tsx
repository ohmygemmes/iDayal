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
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
            ? 'bg-idayal-blue/12 dark:bg-idayal-blue/25 text-idayal-blue'
            : 'text-idayal-text-muted dark:text-zinc-400'
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[9.5px] mt-0.5 font-medium tracking-tightish truncate max-w-full px-0.5 transition-colors ${
          active ? 'text-idayal-blue' : 'text-idayal-text-muted dark:text-zinc-500'
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

        {/* Cartes — bouton central mis en avant, en cercle coloré qui dépasse un peu */}
        <div className="flex-1 flex flex-col items-center justify-end pt-2 pb-1.5">
          <button
            type="button"
            onClick={() => onChange('cards')}
            aria-label="Cartes"
            aria-current={cardsActive ? 'page' : undefined}
            className={`-mt-6 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 active:scale-95 ${
              cardsActive
                ? 'bg-gradient-to-br from-idayal-blue to-idayal-green shadow-[0_10px_24px_rgba(59,125,216,0.45)]'
                : 'bg-gradient-to-br from-idayal-blue/70 to-idayal-green/70 shadow-[0_6px_16px_rgba(59,125,216,0.30)]'
            }`}
          >
            {CARDS_ICON}
          </button>
          <span
            className={`text-[10.5px] mt-0.5 font-semibold tracking-tightish transition-colors ${
              cardsActive
                ? 'text-idayal-blue'
                : 'text-idayal-text-secondary dark:text-zinc-400'
            }`}
          >
            Cartes
          </span>
        </div>

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
