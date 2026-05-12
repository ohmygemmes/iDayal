import { useMemo, useState } from 'react';
import type { Task } from '../types/task';
import { CompletionScreen } from './CompletionScreen';
import { SwipeCard } from './SwipeCard';

interface Props {
  tasks: Task[];
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
}

export function CardsView({ tasks, onComplete, onPostpone }: Props) {
  // Pile = tâches non complétées du jour, dans l'ordre d'arrivée.
  const stack = useMemo(() => tasks.filter((t) => !t.completedDate), [tasks]);
  const [doneCount, setDoneCount] = useState(0);
  const total = stack.length + doneCount;
  const visible = stack.slice(0, 3);

  const handleDone = (id: string) => {
    setDoneCount((c) => c + 1);
    onComplete(id);
  };

  const handlePostpone = (id: string) => {
    onPostpone(id);
  };

  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-5 pt-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <p className="text-[12px] uppercase tracking-[0.08em] font-semibold text-idayal-text-muted dark:text-zinc-500 mb-0.5">
          Une à la fois
        </p>
        <h1 className="text-[28px] font-bold text-idayal-text dark:text-zinc-100 tracking-tight2 leading-none">
          Cartes
        </h1>
        <p className="text-[13px] text-idayal-text-secondary dark:text-zinc-400 mt-1.5">
          Swipe <span className="text-idayal-green font-medium">→</span> pour finir,{' '}
          <span className="text-idayal-orange font-medium">←</span> pour reporter
        </p>
      </header>

      <div className="flex-1 px-5 pb-40 flex flex-col">
        {stack.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <CompletionScreen total={doneCount} />
          </div>
        ) : (
          <div className="relative flex-1 max-h-[520px] mt-4">
            {visible.map((t, i) => (
              <SwipeCard
                key={t.id}
                task={t}
                depth={i}
                onDone={() => handleDone(t.id)}
                onPostpone={() => handlePostpone(t.id)}
              />
            ))}
          </div>
        )}

        {total > 0 && stack.length > 0 && (
          <div className="mt-5 px-1">
            <div className="flex justify-between items-baseline text-[12px] mb-1.5">
              <span className="text-idayal-text-secondary dark:text-zinc-400">
                <span className="tabular font-semibold text-idayal-text dark:text-zinc-200">
                  {doneCount}
                </span>{' '}
                / {total} terminée{total > 1 ? 's' : ''}
              </span>
              <span className="tabular font-semibold text-idayal-green">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-idayal-green to-idayal-green-dark transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
