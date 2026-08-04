export function BrandHeader() {
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
    </header>
  );
}
