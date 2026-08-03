import { useEffect, useMemo, useRef, useState } from 'react';
import { parseFrenchDate } from '../services/frenchDateParser';
import { toLocalISODate, toLocalISODateTime } from '../stores/useTaskStore';

interface Props {
  onAdd: (title: string, scheduledDate: string | null) => void;
  /** Ref pilotée par App pour le raccourci clavier de focus (ordinateur). */
  inputRef?: React.RefObject<HTMLInputElement>;
}

function formatDateChip(iso: string): string {
  const hasTime = iso.length > 10;
  const d = hasTime ? new Date(iso) : new Date(iso + 'T00:00:00');
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function QuickAddBar({ onAdd, inputRef: externalRef }: Props) {
  const [value, setValue] = useState('');
  const [manualDate, setManualDate] = useState(''); // datetime-local string
  const [showPicker, setShowPicker] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? localRef;

  // Suit le clavier iOS via visualViewport.
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

  // Aperçu de la date détectée par le parser, en live.
  const detectedPreview = useMemo(() => {
    const text = value.trim();
    if (!text) return null;
    const { detectedDate } = parseFrenchDate(text);
    if (!detectedDate) return null;
    const hasTime =
      detectedDate.getHours() !== 0 || detectedDate.getMinutes() !== 0;
    return hasTime ? toLocalISODateTime(detectedDate) : toLocalISODate(detectedDate);
  }, [value]);

  // Date effective : manuelle prioritaire, sinon détectée.
  const effectiveScheduled = manualDate || detectedPreview;

  const addOne = (raw: string, forcedDate: string | null) => {
    const text = raw.trim();
    if (!text) return;
    const { cleanTitle, detectedDate } = parseFrenchDate(text);
    const title = cleanTitle || text;
    let scheduled: string | null = forcedDate;
    if (!scheduled && detectedDate) {
      const hasTime = detectedDate.getHours() !== 0 || detectedDate.getMinutes() !== 0;
      scheduled = hasTime ? toLocalISODateTime(detectedDate) : toLocalISODate(detectedDate);
    }
    onAdd(title, scheduled);
  };

  const submit = () => {
    if (!value.trim()) return;
    addOne(value, manualDate || null);
    setValue('');
    setManualDate('');
    setShowPicker(false);
    inputRef.current?.focus();
  };

  /** Coller plusieurs lignes crée plusieurs tâches d'un coup. */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const lines = pasted
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return; // comportement normal
    e.preventDefault();
    lines.forEach((l) => addOne(l, null));
    setValue('');
    setManualDate('');
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-app z-20 px-3"
      style={{
        bottom: keyboardOffset
          ? `calc(${keyboardOffset}px + 8px)`
          : 'calc(env(safe-area-inset-bottom) + 64px)',
        transition: 'bottom 0.12s ease-out',
      }}
    >
      {/* Aperçu de la date détectée / sélectionnée */}
      {effectiveScheduled && (
        <div className="mb-2 flex justify-center">
          <span className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full bg-idayal-blue-soft dark:bg-idayal-blue/15 text-idayal-blue text-[12px] font-medium animate-fade-in shadow-soft border border-idayal-blue/15">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
            <span className="tabular">{formatDateChip(effectiveScheduled)}</span>
            {manualDate && (
              <button
                type="button"
                onClick={() => setManualDate('')}
                aria-label="Retirer la date"
                className="ml-0.5 -mr-1 w-4 h-4 rounded-full hover:bg-idayal-blue/15 flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </span>
        </div>
      )}

      {/* Picker date/heure (toggle) */}
      {showPicker && (
        <div className="mb-2 flex items-center gap-2 bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-bar shadow-elev border border-idayal-border dark:border-idayal-border-dark px-3 py-2 animate-slide-in-up">
          <input
            type="datetime-local"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14px] text-idayal-text dark:text-zinc-100 tabular"
          />
          <button
            type="button"
            onClick={() => {
              setManualDate('');
              setShowPicker(false);
            }}
            className="text-xs text-idayal-text-secondary px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-1.5 bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-bar shadow-elev border border-idayal-border dark:border-idayal-border-dark pl-4 pr-2 py-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onFocus={() => {
            window.setTimeout(() => {
              inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 200);
          }}
          placeholder="Noter une tâche…"
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-idayal-text-muted text-idayal-text dark:text-zinc-100 tracking-tightish"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-label="Choisir une date"
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all ${
            showPicker || manualDate
              ? 'bg-idayal-blue-soft text-idayal-blue dark:bg-idayal-blue/20'
              : 'text-idayal-text-muted hover:text-idayal-blue hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
        </button>
        <button
          type="submit"
          aria-label="Ajouter la tâche"
          disabled={!value.trim()}
          className="w-9 h-9 rounded-full bg-idayal-blue text-white flex items-center justify-center disabled:opacity-30 disabled:bg-idayal-text-muted active:scale-90 transition-all shadow-[0_4px_12px_rgba(59,125,216,0.35)] disabled:shadow-none"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </form>
    </div>
  );
}
