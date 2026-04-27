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

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-4 pt-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <h1 className="text-2xl font-semibold text-idayal-text dark:text-zinc-100">Cartes</h1>
        <p className="text-sm text-idayal-text-secondary dark:text-zinc-400">
          Swipe → pour finir, ← pour reporter.
        </p>
      </header>

      <div className="flex-1 px-5 pb-40 flex flex-col">
        {stack.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <CompletionScreen total={doneCount} />
          </div>
        ) : (
          <div className="relative flex-1 max-h-[520px] mt-2">
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
          <div className="mt-4 px-1">
            <div className="flex justify-between text-xs text-idayal-text-secondary dark:text-zinc-400 mb-1">
              <span>
                {doneCount} sur {total} terminée{total > 1 ? 's' : ''}
              </span>
              <span>{Math.round((doneCount / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-idayal-green transition-all duration-300"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
