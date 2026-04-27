import { useEffect, useRef, useState } from 'react';
import { parseFrenchDate } from '../services/frenchDateParser';

interface Props {
  onAdd: (title: string, scheduledDate: string | null) => void;
}

export function QuickAddBar({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gérer le clavier iOS via visualViewport.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    const { cleanTitle, detectedDate } = parseFrenchDate(text);
    const scheduled = detectedDate
      ? detectedDate.getHours() === 0 && detectedDate.getMinutes() === 0
        ? detectedDate.toISOString().slice(0, 10)
        : detectedDate.toISOString()
      : null;
    onAdd(cleanTitle || text, scheduled);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-phone z-20 px-3"
      style={{
        bottom: keyboardOffset
          ? `calc(${keyboardOffset}px + 8px)`
          : 'calc(env(safe-area-inset-bottom) + 64px)',
        transition: 'bottom 0.12s ease-out',
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-bar shadow-lg border border-black/5 dark:border-white/10 px-3 py-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            // S'assurer que l'input reste visible.
            window.setTimeout(() => {
              inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 200);
          }}
          placeholder="Une tâche, ex: « appeler Marie demain à 10h »"
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-idayal-text-secondary text-idayal-text dark:text-zinc-100"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          type="submit"
          aria-label="Ajouter la tâche"
          disabled={!value.trim()}
          className="w-9 h-9 rounded-full bg-idayal-blue text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </form>
    </div>
  );
}
