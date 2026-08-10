import { Wordmark } from './Wordmark';

export function BrandHeader() {
  return (
    /*
      Le nom passe en mention.
      C'est la date qui est devenue le titre de l'écran : deux titres se
      disputaient le haut de page, et celui qui n'apprend rien — on sait quelle
      application on a ouverte — prend désormais un tiers de la hauteur qu'il avait.
    */
    <header
      className="flex items-baseline gap-2 px-5 pt-3 pb-1"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
    >
      {/* Le nom est en `currentColor` : le mode sombre l'inverse tout seul. */}
      <Wordmark height={19} className="text-[#16255B] dark:text-white" />
      <span className="text-[10.5px] text-idayal-text-muted dark:text-zinc-500 italic">
        ma journée idéale
      </span>
    </header>
  );
}
