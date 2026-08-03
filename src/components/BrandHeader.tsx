interface Props {
  onOpenSettings: () => void;
}

export function BrandHeader({ onOpenSettings }: Props) {
  return (
    <header
      className="flex items-center justify-between px-5 pt-3 pb-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      <div className="flex flex-col">
        <span className="text-[20px] font-bold tracking-tight2 leading-none bg-gradient-to-br from-idayal-blue to-idayal-green bg-clip-text text-transparent">
          iDayal
        </span>
        <span className="text-[11px] text-idayal-text-muted dark:text-zinc-500 mt-0.5 italic">
          ma journée idéale
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Réglages"
        className="w-9 h-9 rounded-full bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev border border-idayal-border dark:border-idayal-border-dark shadow-soft flex items-center justify-center text-idayal-text-secondary dark:text-zinc-300 active:scale-90 transition"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
    </header>
  );
}
