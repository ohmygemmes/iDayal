/**
 * L'application tourne-t-elle dans la coque native (Capacitor), ou dans un
 * navigateur ?
 *
 * On ne passe volontairement pas par `@capacitor/core`. Le pont natif injecte
 * lui-même `window.Capacitor` dans la page avant que notre code démarre :
 * importer le paquet n'apporterait rien de plus, et alourdirait le build web,
 * qui n'en a aucun usage.
 *
 * Le protocole est testé en second : sur iOS la coque sert la page depuis
 * `capacitor://localhost`. Une adresse pareille ne peut pas venir d'un
 * navigateur.
 */
interface CapacitorBridge {
  isNativePlatform?: () => boolean;
}

export function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = (window as Window & { Capacitor?: CapacitorBridge }).Capacitor;
  if (bridge?.isNativePlatform?.()) return true;
  return window.location.protocol === 'capacitor:';
}
