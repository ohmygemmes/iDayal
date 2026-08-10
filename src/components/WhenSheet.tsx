import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toLocalISODate, toLocalISODateTime } from '../services/localDate';

interface Props {
  open: boolean;
  /** Titre de la tâche concernée, rappelé sous la question. */
  title: string;
  /** Échéance actuelle, pour ouvrir le calendrier au bon endroit. */
  current: string | null;
  onPick: (scheduledDate: string) => void;
  onClose: () => void;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * « Quand ? » — un composant, deux usages.
 *
 * Modifier l'heure d'un rappel et reporter une tâche sont la même question :
 * choisir un moment pour quelque chose qui en a déjà un. Deux feuilles auraient
 * signifié deux comportements à apprendre pour une seule décision.
 *
 * Les deux réponses fréquentes sont côte à côte, en grand, atteignables au pouce
 * sans viser. Le choix lent — une date et une heure précises — passe en dessous,
 * sur sa propre ligne.
 *
 * Chaque bouton affiche le jour qu'il désigne : « demain » sans dire lundi 10,
 * c'est une devinette.
 */
export function WhenSheet({ open, title, current, onPick, onClose }: Props) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [precise, setPrecise] = useState(false);
  const preciseRef = useRef<HTMLInputElement>(null);

  // Chaque ouverture repart de la question, jamais du calendrier resté ouvert.
  useEffect(() => {
    if (!open) setPrecise(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  /*
   * Valeur d'ouverture du calendrier : l'échéance actuelle si elle porte une
   * heure, sinon aujourd'hui à 9 h. Un champ vide ouvrirait sur le mois courant
   * sans rien présélectionner, et il faudrait deux gestes de plus.
   */
  const seed =
    current && current.length > 10 ? current.slice(0, 16) : `${toLocalISODate(today)}T09:00`;

  const choose = (d: Date) => {
    onPick(toLocalISODate(d));
    onClose();
  };

  /*
   * Posée directement dans `body`, jamais là où on l'appelle.
   *
   * La carte du paquet porte une `transform` pour suivre le doigt. Or une
   * transformation crée un nouveau référentiel : un `position: fixed` placé
   * dedans se cale sur la carte et non sur l'écran. La feuille se retrouvait
   * enfermée dans les bords de la carte, voile compris.
   */
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fade-in"
      />

      <div className="relative w-full max-w-app px-3 pb-3 animate-slide-in-up">
        <div className="rounded-[26px] bg-idayal-bg-elev dark:bg-idayal-bg-dark-elev border border-idayal-border dark:border-idayal-border-dark shadow-elev p-4 pb-5 flex flex-col gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-idayal-text dark:text-zinc-100 tracking-tight2">
              Quand ?
            </h2>
            <p className="text-[13px] text-idayal-text-secondary dark:text-zinc-400 truncate">
              {title}
            </p>
          </div>

          {/* Les deux réponses de neuf cas sur dix, côte à côte et en grand. */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => choose(today)}
              className="flex-1 flex flex-col items-start gap-0.5 p-3.5 rounded-2xl bg-idayal-blue text-white active:scale-[0.97] transition"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span className="text-[16px] font-semibold mt-1">Aujourd'hui</span>
              <span className="text-[12px] text-white/75 tabular">{dayLabel(today)}</span>
            </button>

            <button
              type="button"
              onClick={() => choose(tomorrow)}
              className="flex-1 flex flex-col items-start gap-0.5 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 text-idayal-text dark:text-zinc-100 active:scale-[0.97] transition"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-idayal-blue dark:text-idayal-blue-light">
                <path d="M4 12h13M13 7l5 5-5 5" />
              </svg>
              <span className="text-[16px] font-semibold mt-1">Demain</span>
              <span className="text-[12px] text-idayal-text-muted dark:text-zinc-500 tabular">
                {dayLabel(tomorrow)}
              </span>
            </button>
          </div>

          {/*
            Le choix lent. Le champ natif est posé en transparence par-dessus la
            ligne : la toucher ouvre le calendrier du système du premier coup —
            un champ affiché à côté demanderait un second geste.
          */}
          <div className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-idayal-blue dark:text-idayal-blue-light flex-shrink-0">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            <span className="text-[15px] font-medium text-idayal-text dark:text-zinc-100">
              Choisir une date et une heure
            </span>
            <span className="ml-auto text-idayal-text-muted text-[13px]">▸</span>
            <input
              ref={preciseRef}
              type="datetime-local"
              aria-label="Choisir une date et une heure"
              defaultValue={seed}
              required
              onChange={(e) => {
                if (!e.target.value) return;
                setPrecise(true);
                onPick(toLocalISODateTime(new Date(e.target.value)));
                onClose();
              }}
              className="absolute inset-0 w-full h-full opacity-0"
            />
          </div>

          {precise && <span className="sr-only">Échéance modifiée</span>}
        </div>
      </div>
    </div>,
    document.body
  );
}
