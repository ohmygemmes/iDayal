import { Wordmark } from './Wordmark';

export function BrandHeader() {
  return (
    <header
      className="flex items-center px-5 pt-3 pb-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      <div className="flex flex-col">
        {/* Le nom est en `currentColor` : le mode sombre l'inverse tout seul. */}
        <Wordmark height={34} className="text-[#16255B] dark:text-white" />
        <span className="text-[11px] text-idayal-text-muted dark:text-zinc-500 mt-1 italic pl-[3px]">
          ma journée idéale
        </span>
      </div>
    </header>
  );
}
