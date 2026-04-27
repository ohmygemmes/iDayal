import { useMemo } from 'react';
import type { Task } from '../types/task';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // Lundi = 1 ; on ramène à lundi de la semaine courante.
  const day = x.getDay() === 0 ? 7 : x.getDay();
  x.setDate(x.getDate() - (day - 1));
  return x;
}

interface Group {
  key: string;
  label: string;
  items: Task[];
}

function groupTasks(tasks: Task[]): Group[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startThisWeek = startOfWeek(today);
  const startNextWeek = new Date(startThisWeek);
  startNextWeek.setDate(startThisWeek.getDate() + 7);
  const startWeekAfter = new Date(startNextWeek);
  startWeekAfter.setDate(startNextWeek.getDate() + 7);
  const startNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const startMonthAfter = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const groups = new Map<string, Group>();
  const ensure = (key: string, label: string) => {
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    return groups.get(key)!;
  };

  for (const t of tasks) {
    if (!t.scheduledDate) continue;
    const d = new Date(t.scheduledDate.length > 10 ? t.scheduledDate : t.scheduledDate + 'T00:00:00');
    if (d < startNextWeek) ensure('this-week', 'Cette semaine').items.push(t);
    else if (d < startWeekAfter) ensure('next-week', 'Semaine prochaine').items.push(t);
    else if (d < startNextMonth) ensure('this-month', 'Ce mois').items.push(t);
    else if (d < startMonthAfter) {
      const label = startNextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      ensure(`m-${startNextMonth.toISOString().slice(0, 7)}`, label).items.push(t);
    } else {
      const key = `m-${d.toISOString().slice(0, 7)}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      ensure(key, label).items.push(t);
    }
  }

  // Tri interne par date.
  const out = Array.from(groups.values());
  for (const g of out) {
    g.items.sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''));
  }

  // Ordre des groupes : this-week, next-week, this-month, puis mois suivants chrono.
  const orderHead = ['this-week', 'next-week', 'this-month'];
  out.sort((a, b) => {
    const ai = orderHead.indexOf(a.key);
    const bi = orderHead.indexOf(b.key);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  return out;
}

export function LaterView({ tasks, onToggle, onDelete }: Props) {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);

  return (
    <div className="flex flex-col h-full">
      <header
        className="px-4 pt-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <h1 className="text-2xl font-semibold text-idayal-text dark:text-zinc-100">Plus tard</h1>
        <p className="text-sm text-idayal-text-secondary dark:text-zinc-400">
          {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} planifiée
          {tasks.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-32">
        {groups.length === 0 && (
          <div className="text-center text-idayal-text-secondary dark:text-zinc-400 mt-16 px-6">
            <div className="text-4xl mb-3">🗓</div>
            <p>Pas de tâche planifiée.</p>
            <p className="text-sm mt-1">
              Essaie « rendez-vous le 15 avril » ou « appeler maman dans 3 jours ».
            </p>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.key} className="mb-5">
            <h2 className="px-1 mb-2 text-xs uppercase tracking-wide text-idayal-text-secondary dark:text-zinc-500">
              {g.label}
            </h2>
            <ul>
              {g.items.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} showDate />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
