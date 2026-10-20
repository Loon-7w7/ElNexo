import { render } from 'preact';
import App from './App';
import { APP_NAME, APP_TAGLINE } from './lib/brand';
import { importSharedConfig } from './lib/config';
// Fuentes autoalojadas: solo caracteres latinos y los pesos que se usan.
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-sans/latin-700.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import './styles/themes.css';

document.title = `${APP_NAME} — ${APP_TAGLINE}`;

// Antes del primer render: un enlace compartido se guarda y la barra de direcciones queda limpia.
importSharedConfig();

render(<App />, document.getElementById('root')!);
