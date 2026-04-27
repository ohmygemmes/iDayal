interface Props {
  total: number;
}

export function CompletionScreen({ total }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16 animate-bounce-in">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-semibold text-idayal-text dark:text-zinc-100 mb-2">
        Journée bouclée !
      </h2>
      <p className="text-idayal-text-secondary dark:text-zinc-400">
        {total > 0
          ? `${total} tâche${total > 1 ? 's' : ''} bouclée${total > 1 ? 's' : ''}.`
          : "Rien à faire aujourd'hui — profite."}
      </p>
    </div>
  );
}
