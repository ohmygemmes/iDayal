import type { TabKey } from '../types/task';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

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
      className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 transition-transform active:scale-95"
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
        className={`text-[10.5px] mt-0.5 font-medium tracking-tightish transition-colors ${
          active ? 'text-idayal-blue' : 'text-idayal-text-muted dark:text-zinc-500'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function TabBar({ active, onChange }: Props) {
  const cardsActive = active === 'cards';
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-phone z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-3 mb-2 flex items-end justify-around bg-white/85 dark:bg-idayal-bg-dark-elev/85 backdrop-blur-xl rounded-bar shadow-bar border border-idayal-border dark:border-idayal-border-dark px-2">
        <SideTab
          label="Aujourd'hui"
          icon={TODAY_ICON}
          active={active === 'today'}
          onClick={() => onChange('today')}
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
          label="Plus tard"
          icon={LATER_ICON}
          active={active === 'later'}
          onClick={() => onChange('later')}
        />
      </div>
    </nav>
  );
}
