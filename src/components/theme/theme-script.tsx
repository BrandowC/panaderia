/**
 * Se ejecuta antes del primer pintado para evitar el destello claro al cargar en
 * modo noche. No usa React porque debe correr antes de la hidratacion.
 */
const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('theme');
var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme=(s==='dark'||s==='light')?s:(d?'dark':'light');
}catch(e){document.documentElement.dataset.theme='light';}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
