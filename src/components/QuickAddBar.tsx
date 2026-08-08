import { useEffect, useMemo, useRef, useState } from 'react';
import { parseFrenchDate } from '../services/frenchDateParser';
import { atTimeOfDay, shiftBy } from '../services/dateShortcuts';
import { toLocalISODate, toLocalISODateTime } from '../services/localDate';

interface Props {
  onAdd: (title: string, scheduledDate: string | null) => void;
  /** Ref pilotée par App pour le raccourci clavier de focus (ordinateur). */
  inputRef?: React.RefObject<HTMLInputElement>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Heures fixes proposées, posées telles quelles sur le jour retenu. */
const FIXED_TIMES: Array<[number, number]> = [
  [9, 0],
  [12, 0],
  [18, 0],
];

/** Décalages, appliqués à l'heure déjà retenue — pas à l'instant présent. */
const SHIFTS: Array<{ label: string; hours: number }> = [
  { label: '+1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24', hours: 24 },
];

/** Libellé du jour retenu : « Aujourd'hui », « Demain », sinon la date courte. */
function dayPillLabel(iso: string): string {
  const day = iso.slice(0, 10);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  let label: string;
  if (day === toLocalISODate(today)) label = "Aujourd'hui";
  else if (day === toLocalISODate(tomorrow)) label = 'Demain';
  else
    label = new Date(day + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  const time = iso.length > 10 ? iso.slice(11, 16) : null;
  return time ? `${label}, ${time}` : label;
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);

/** Petite flèche au-dessus des heures fixes, comme repère de « poser à ». */
const JumpArrow = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** Bouton d'une rangée groupée (heures fixes, décalages). */
function GroupButton({
  children,
  onClick,
  active,
  arrow,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  arrow?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 h-11 rounded-full transition-all active:scale-95 ${
        active
          ? 'bg-idayal-blue text-white shadow-[0_2px_10px_rgba(59,125,216,0.35)]'
          : 'text-idayal-text dark:text-zinc-200'
      }`}
    >
      {arrow && <JumpArrow />}
      <span className="tabular text-[15px] font-medium leading-none">{children}</span>
    </button>
  );
}

const groupShell =
  'inline-flex items-center gap-0.5 p-1 rounded-full bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev shadow-soft border border-idayal-border dark:border-idayal-border-dark';

export function QuickAddBar({ onAdd, inputRef: externalRef }: Props) {
  const [value, setValue] = useState('');
  /** Date retenue à la main : 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm'. */
  const [manualDate, setManualDate] = useState('');
  const [focused, setFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? localRef;
  const blurTimer = useRef<number | undefined>(undefined);

  /*
   * Toucher un raccourci retire le focus du champ, ce qui ferait disparaître
   * la rangée avant que le clic n'aboutisse.
   *
   * La première version bloquait le geste avec preventDefault sur pointerdown.
   * Mauvaise idée : sur mobile cela supprime le clic qui suit sans toujours
   * empêcher la perte de focus — le raccourci ne répondait plus et la rangée
   * s'effaçait quand même.
   *
   * On laisse donc le focus partir, mais on retarde la disparition : le clic a
   * le temps d'arriver, et le gestionnaire remet le champ au premier plan.
   */
  const hold = () => window.clearTimeout(blurTimer.current);

  /** Agit, garde la rangée, et rend le clavier au champ pour continuer à taper. */
  const act = (fn: () => void) => () => {
    hold();
    fn();
    inputRef.current?.focus();
  };

  /*
   * Les sélecteurs natifs prennent le focus à la place du champ de saisie.
   * Sans ces deux gestionnaires, la rangée s'effacerait derrière le calendrier
   * pendant qu'il est ouvert. On ne rend donc pas le clavier ici : cela
   * refermerait le sélecteur aussitôt.
   */
  const holdOpen = () => {
    hold();
    setFocused(true);
  };

  /*
   * Au doigt, toucher le champ suffit à ouvrir le sélecteur. À la souris, non :
   * Chrome et Firefox ne l'ouvrent que depuis leur petite icône, que la
   * transparence rend inatteignable — le contrôle serait mort sur ordinateur.
   * `showPicker` couvre ce cas, et n'est appelé que sur pointeur fin pour ne
   * rien changer au tactile, qui fonctionne déjà.
   */
  const openNativePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!window.matchMedia?.('(pointer: fine)').matches) return;
    try {
      e.currentTarget.showPicker();
    } catch {
      // Non supporté, ou déjà ouvert : le comportement par défaut prend le relais.
    }
  };
  const releaseSoon = () => {
    hold();
    blurTimer.current = window.setTimeout(() => setFocused(false), 250);
  };

  useEffect(() => () => window.clearTimeout(blurTimer.current), []);

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
    const hasTime = detectedDate.getHours() !== 0 || detectedDate.getMinutes() !== 0;
    return hasTime ? toLocalISODateTime(detectedDate) : toLocalISODate(detectedDate);
  }, [value]);

  // Date effective : celle posée à la main prime sur celle lue dans le texte.
  const effectiveScheduled = manualDate || detectedPreview;
  const chosenDay = effectiveScheduled ? effectiveScheduled.slice(0, 10) : null;
  const chosenTime =
    effectiveScheduled && effectiveScheduled.length > 10
      ? effectiveScheduled.slice(11, 16)
      : null;

  /* Les règles de décalage vivent dans services/dateShortcuts, où elles sont
     couvertes par des tests : elles portent des promesses précises (« 12h puis
     +1h donne 13h ») que rien ne rattraperait à la relecture. */
  const applyShift = (hours: number) =>
    setManualDate(shiftBy(effectiveScheduled ?? '', hours, new Date()));

  const setTimeOfDay = (h: number, m: number) =>
    setManualDate(atTimeOfDay(effectiveScheduled ?? '', h, m, new Date()));

  /** Retire le choix manuel : la barre revient à ce que dit le texte, sinon à aujourd'hui. */
  const clearDate = () => setManualDate('');

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

  const showShortcuts = focused || Boolean(manualDate);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-app z-20 px-3"
      style={{
        // 82px : la barre d'onglets culmine à 74px du bas, on garde 8px d'écart.
        bottom: keyboardOffset
          ? `calc(${keyboardOffset}px + 8px)`
          : 'calc(env(safe-area-inset-bottom) + 82px)',
        transition: 'bottom 0.12s ease-out',
      }}
    >
      {/* Raccourcis de date, pendant la saisie seulement. Voir `hold` plus haut
          pour la raison du délai à la perte de focus. */}
      {showShortcuts && (
        <div className="mb-2 flex flex-col items-start gap-1.5 animate-fade-in">
          {/*
            Le jour retenu, toujours actif : sans date explicite une tâche est
            déjà celle du jour, donc « Aujourd'hui » est l'état par défaut, pas
            une absence de choix. Le toucher ouvre le calendrier.
          */}
          <div className="flex items-center gap-1.5">
            {/*
              Le champ de date est posé par-dessus la pastille, invisible.
              Toucher la pastille, c'est donc toucher le champ : le calendrier
              du système s'ouvre du premier coup.

              Le champ était auparavant affiché dans une rangée à part. Un
              `input[type=date]` s'y montrait vide, et il fallait le toucher à
              son tour pour voir enfin le calendrier — deux gestes pour un.
            */}
            <div className="relative inline-flex items-center gap-2 h-11 pl-3.5 pr-4 rounded-full text-[15px] font-semibold bg-idayal-blue text-white shadow-[0_4px_14px_rgba(59,125,216,0.40)] active:scale-95 transition-transform">
              <CalendarIcon />
              {effectiveScheduled ? dayPillLabel(effectiveScheduled) : "Aujourd'hui"}
              <input
                type="date"
                aria-label="Choisir le jour"
                /* Jamais vide : le calendrier doit s'ouvrir sur le bon mois. */
                value={chosenDay ?? toLocalISODate(new Date())}
                /*
                  Le calendrier affiché est celui du navigateur : ses commandes
                  ne nous appartiennent pas et ne peuvent pas être retirées
                  depuis la page. `required` est le seul levier — un champ qui
                  ne peut pas être vide n'a pas de raison d'offrir « effacer »,
                  et plusieurs navigateurs masquent le bouton en conséquence.
                  Sans effet sur la saisie : le champ porte toujours une valeur,
                  et il est hors du formulaire d'ajout.
                */
                required
                onClick={openNativePicker}
                onFocus={holdOpen}
                onBlur={releaseSoon}
                onChange={(e) => {
                  hold();
                  /* Si le navigateur garde son bouton « effacer », qu'il fasse
                     au moins la même chose que la croix : retirer le choix
                     manuel — plutôt que de rester sans effet. */
                  if (!e.target.value) return clearDate();
                  setManualDate(
                    chosenTime ? `${e.target.value}T${chosenTime}` : e.target.value
                  );
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none bg-transparent border-0 p-0"
              />
            </div>
            {manualDate && (
              <button
                type="button"
                onClick={act(clearDate)}
                aria-label="Retirer la date"
                className="w-9 h-9 rounded-full bg-idayal-blue/90 text-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-all shadow-soft"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>

          {/* Heures fixes. */}
          <div className={groupShell}>
            {FIXED_TIMES.map(([h, m]) => {
              const label = `${pad2(h)}:${pad2(m)}`;
              return (
                <GroupButton
                  key={label}
                  arrow
                  active={chosenTime === label}
                  onClick={act(() => setTimeOfDay(h, m))}
                >
                  {label}
                </GroupButton>
              );
            })}
          </div>

          {/* Décalages, à partir de l'heure retenue. */}
          <div className={groupShell}>
            {SHIFTS.map((s) => (
              <GroupButton key={s.label} onClick={act(() => applyShift(s.hours))}>
                {s.label}
              </GroupButton>
            ))}
            {/* Même principe pour l'heure libre : le champ recouvre le bouton. */}
            <div className="relative flex flex-col items-center justify-center px-3 h-11 rounded-full text-idayal-text dark:text-zinc-200 active:scale-95 transition-transform">
              <span className="tabular text-[15px] font-medium leading-none">•••</span>
              <input
                type="time"
                aria-label="Choisir l'heure"
                value={chosenTime ?? ''}
                onClick={openNativePicker}
                onFocus={holdOpen}
                onBlur={releaseSoon}
                onChange={(e) => {
                  hold();
                  const day = chosenDay ?? toLocalISODate(new Date());
                  setManualDate(e.target.value ? `${day}T${e.target.value}` : day);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none bg-transparent border-0 p-0"
              />
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`flex items-center gap-1.5 bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev rounded-[28px] pl-5 pr-2 py-2 transition-all duration-200 ${
          focused
            ? 'ring-2 ring-idayal-blue/45 shadow-[0_10px_32px_-6px_rgba(59,125,216,0.40),0_2px_8px_rgba(15,16,32,0.10)]'
            : 'ring-1 ring-idayal-blue/15 shadow-[0_8px_28px_-6px_rgba(15,16,32,0.22),0_2px_6px_rgba(15,16,32,0.08)]'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onFocus={() => {
            hold();
            setFocused(true);
            window.setTimeout(() => {
              inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 200);
          }}
          /* Fenêtre volontaire : le temps qu'un tap sur un raccourci aboutisse. */
          onBlur={() => {
            hold();
            blurTimer.current = window.setTimeout(() => setFocused(false), 250);
          }}
          placeholder="Noter une tâche…"
          /* 16px minimum : en dessous, Safari iOS zoome la page à la mise au point. */
          className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[16px] placeholder:text-idayal-text-muted text-idayal-text dark:text-zinc-100"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          type="submit"
          aria-label="Ajouter la tâche"
          disabled={!value.trim()}
          className="w-11 h-11 rounded-full bg-idayal-blue text-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:bg-idayal-text-muted active:scale-90 transition-all shadow-[0_4px_14px_rgba(59,125,216,0.45)] disabled:shadow-none"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </form>
    </div>
  );
}
