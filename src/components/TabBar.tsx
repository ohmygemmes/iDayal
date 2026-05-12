import type { TabKey } from '../types/task';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
  {
    key: 'today',
    label: "Aujourd'hui",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    key: 'later',
    label: 'Plus tard',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    key: 'cards',
    label: 'Cartes',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="12" height="16" rx="2.5" />
        <rect x="3" y="7" width="12" height="14" rx="2.5" opacity="0.45" />
      </svg>
    ),
  },
];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-phone z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-3 mb-2 flex justify-around bg-white/85 dark:bg-idayal-bg-dark-elev/85 backdrop-blur-xl rounded-bar shadow-bar border border-idayal-border dark:border-idayal-border-dark">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 transition-transform active:scale-95"
              aria-label={t.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-idayal-blue/12 dark:bg-idayal-blue/25 text-idayal-blue'
                    : 'text-idayal-text-muted dark:text-zinc-400'
                }`}
              >
                {t.icon}
              </span>
              <span
                className={`text-[10.5px] mt-0.5 font-medium tracking-tightish transition-colors ${
                  isActive
                    ? 'text-idayal-blue'
                    : 'text-idayal-text-muted dark:text-zinc-500'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
