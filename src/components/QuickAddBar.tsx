import { useEffect, useMemo, useRef, useState } from 'react';
import { parseFrenchDate } from '../services/frenchDateParser';
import { toLocalISODate, toLocalISODateTime } from '../stores/useTaskStore';

interface Props {
  onAdd: (title: string, scheduledDate: string | null) => void;
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

export function QuickAddBar({ onAdd }: Props) {
  const [value, setValue] = useState('');
  const [manualDate, setManualDate] = useState(''); // datetime-local string
  const [showPicker, setShowPicker] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    let scheduled: string | null = null;
    let title = text;
    if (manualDate) {
      // Le parser nettoie quand même le titre s'il y a une date dedans.
      const { cleanTitle } = parseFrenchDate(text);
      title = cleanTitle || text;
      scheduled = manualDate; // déjà au format YYYY-MM-DDTHH:mm local
    } else {
      const { cleanTitle, detectedDate } = parseFrenchDate(text);
      title = cleanTitle || text;
      if (detectedDate) {
        const hasTime =
          detectedDate.getHours() !== 0 || detectedDate.getMinutes() !== 0;
        scheduled = hasTime
          ? toLocalISODateTime(detectedDate)
          : toLocalISODate(detectedDate);
      }
    }
    onAdd(title, scheduled);
    setValue('');
    setManualDate('');
    setShowPicker(false);
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
      {/* Aperçu de la date détectée / sélectionnée */}
      {effectiveScheduled && (
        <div className="mb-1.5 flex justify-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-idayal-blue/10 text-idayal-blue text-xs font-medium animate-fade-in">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
            {formatDateChip(effectiveScheduled)}
            {manualDate && (
              <button
                type="button"
                onClick={() => setManualDate('')}
                aria-label="Retirer la date"
                className="ml-1 -mr-1"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </span>
        </div>
      )}

      {/* Picker date/heure (toggle) */}
      {showPicker && (
        <div className="mb-1.5 flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-bar shadow-md border border-black/5 dark:border-white/10 px-3 py-2 animate-slide-in-up">
          <input
            type="datetime-local"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14px] text-idayal-text dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => {
              setManualDate('');
              setShowPicker(false);
            }}
            className="text-xs text-idayal-text-secondary px-2 py-1"
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
        className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-bar shadow-lg border border-black/5 dark:border-white/10 px-3 py-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            window.setTimeout(() => {
              inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 200);
          }}
          placeholder="Une tâche, ex: « courses demain à 10h »"
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-idayal-text-secondary text-idayal-text dark:text-zinc-100"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-label="Choisir une date"
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition ${
            showPicker || manualDate
              ? 'bg-idayal-blue/15 text-idayal-blue'
              : 'text-idayal-text-secondary'
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
